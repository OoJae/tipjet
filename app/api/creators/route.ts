import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import {
  getCreator,
  createCreator,
  rateLimit,
  getHandleByAddress,
} from "@/lib/store";
import {
  normalizeHandle,
  isValidHandle,
  claimSignaturePayload,
  type Creator,
} from "@/lib/creators";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const MAX_SIGNATURE_AGE_MS = 10 * 60 * 1000;

function clientIp(req: NextRequest): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",").pop()!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function GET(req: NextRequest) {
  try {
    // Resolve the creator a login address owns (reverse index) — the dashboard
    // trusts this over localStorage.
    const addr = req.nextUrl.searchParams.get("address");
    if (addr) {
      if (!ADDRESS_RE.test(addr)) {
        return NextResponse.json({ error: "Invalid address." }, { status: 400 });
      }
      const ownedHandle = await getHandleByAddress(addr);
      const creator = ownedHandle ? await getCreator(ownedHandle) : null;
      if (!creator) {
        return NextResponse.json({ error: "No handle for that account." }, { status: 404 });
      }
      return NextResponse.json(creator);
    }

    const raw = req.nextUrl.searchParams.get("handle");
    if (!raw) {
      return NextResponse.json({ error: "Missing handle." }, { status: 400 });
    }
    const handle = normalizeHandle(raw);
    if (!isValidHandle(handle)) {
      // An invalid handle can never exist — same as not found.
      return NextResponse.json({ error: "Creator not found." }, { status: 404 });
    }
    const creator = await getCreator(handle);
    if (!creator) {
      return NextResponse.json({ error: "Creator not found." }, { status: 404 });
    }
    return NextResponse.json(creator);
  } catch {
    return NextResponse.json(
      { error: "Could not look up that handle right now." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      handle?: unknown;
      displayName?: unknown;
      receivingAddress?: unknown;
      ts?: unknown;
      signature?: unknown;
    } | null;

    if (
      !body ||
      typeof body.handle !== "string" ||
      typeof body.displayName !== "string" ||
      typeof body.receivingAddress !== "string" ||
      typeof body.ts !== "number" ||
      typeof body.signature !== "string"
    ) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    // Blunt handle-squatting loops (3 registrations/min/IP, trusted IP).
    if (!(await rateLimit(`claim:${clientIp(req)}`, 3, 60))) {
      return NextResponse.json(
        { error: "Too many attempts — try again in a minute." },
        { status: 429 },
      );
    }

    const handle = normalizeHandle(body.handle);
    const displayName = body.displayName.trim();
    const receivingAddress = body.receivingAddress.trim();

    if (!isValidHandle(handle)) {
      return NextResponse.json(
        { error: "Handles are 2–24 characters: letters, numbers, underscores." },
        { status: 400 },
      );
    }
    if (displayName.length < 1 || displayName.length > 50) {
      return NextResponse.json(
        { error: "Display name must be 1–50 characters." },
        { status: 400 },
      );
    }
    if (!ADDRESS_RE.test(receivingAddress)) {
      return NextResponse.json(
        { error: "Invalid receiving address." },
        { status: 400 },
      );
    }
    if (Math.abs(Date.now() - body.ts) > MAX_SIGNATURE_AGE_MS) {
      return NextResponse.json(
        { error: "That request expired — please try again." },
        { status: 400 },
      );
    }
    // Prove control of the payout wallet: the claim is signed by
    // receivingAddress. You can't register a handle that pays out to a wallet
    // you don't hold (and this enables account recovery later).
    let recovered: string;
    try {
      recovered = verifyMessage(
        claimSignaturePayload(handle, displayName, receivingAddress, body.ts),
        body.signature,
      );
    } catch {
      return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
    }
    if (recovered.toLowerCase() !== receivingAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Signature doesn't match the payout address." },
        { status: 403 },
      );
    }

    const creator: Creator = {
      handle,
      displayName,
      receivingAddress,
      createdAt: Date.now(),
    };
    const created = await createCreator(creator);
    if (!created) {
      return NextResponse.json(
        { error: "That handle is already taken." },
        { status: 409 },
      );
    }
    return NextResponse.json(created);
  } catch {
    return NextResponse.json(
      { error: "Could not claim that handle right now." },
      { status: 500 },
    );
  }
}
