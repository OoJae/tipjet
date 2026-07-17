import { NextRequest, NextResponse } from "next/server";
import { getCreator, createCreator, rateLimit } from "@/lib/store";
import { normalizeHandle, isValidHandle, type Creator } from "@/lib/creators";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export async function GET(req: NextRequest) {
  try {
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
    } | null;

    if (
      !body ||
      typeof body.handle !== "string" ||
      typeof body.displayName !== "string" ||
      typeof body.receivingAddress !== "string"
    ) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    // Blunt handle-squatting loops (3 registrations/min/IP).
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!(await rateLimit(`claim:${ip}`, 3, 60))) {
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
