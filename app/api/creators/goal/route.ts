import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import { getCreator, updateCreatorGoal, rateLimit } from "@/lib/store";
import {
  normalizeHandle,
  isValidHandle,
  goalSignaturePayload,
} from "@/lib/creators";

const MAX_SIGNATURE_AGE_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      handle?: unknown;
      goalUsd?: unknown;
      goalLabel?: unknown;
      ts?: unknown;
      signature?: unknown;
    } | null;

    if (
      !body ||
      typeof body.handle !== "string" ||
      typeof body.ts !== "number" ||
      typeof body.signature !== "string"
    ) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!(await rateLimit(`goal:${ip}`, 6, 60))) {
      return NextResponse.json(
        { error: "Too many attempts — try again in a minute." },
        { status: 429 },
      );
    }
    const handle = normalizeHandle(body.handle);
    if (!isValidHandle(handle)) {
      // An invalid handle can never exist — same as not found.
      return NextResponse.json({ error: "Unknown handle." }, { status: 404 });
    }
    if (typeof body.goalUsd !== "number" || !Number.isFinite(body.goalUsd)) {
      return NextResponse.json({ error: "Invalid goal amount." }, { status: 400 });
    }
    const goalUsd = Math.round(body.goalUsd * 100) / 100;
    if (goalUsd !== 0 && (goalUsd < 1 || goalUsd > 100000)) {
      return NextResponse.json(
        { error: "Goals are $1–$100,000 ($0 clears the goal)." },
        { status: 400 },
      );
    }
    if (body.goalLabel !== undefined && typeof body.goalLabel !== "string") {
      return NextResponse.json({ error: "Invalid goal label." }, { status: 400 });
    }
    const goalLabel =
      typeof body.goalLabel === "string"
        ? body.goalLabel.trim().slice(0, 40)
        : "";

    if (Math.abs(Date.now() - body.ts) > MAX_SIGNATURE_AGE_MS) {
      return NextResponse.json(
        { error: "That request expired — please try again." },
        { status: 403 },
      );
    }

    const creator = await getCreator(handle);
    if (!creator) {
      return NextResponse.json({ error: "Unknown handle." }, { status: 404 });
    }

    // Only the wallet that owns this handle can change its goal: the client
    // signs the exact payload with the creator's Magic wallet, and we require
    // the recovered signer to match the stored receiving address. (The address
    // itself is public — on-chain and in GET /api/creators — so it is NOT a
    // credential; the signature is.)
    let recovered: string;
    try {
      recovered = verifyMessage(
        goalSignaturePayload(handle, goalUsd, goalLabel, body.ts),
        body.signature,
      );
    } catch {
      return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
    }
    if (recovered.toLowerCase() !== creator.receivingAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "This handle isn't linked to your account." },
        { status: 403 },
      );
    }

    const updated = await updateCreatorGoal(handle, goalUsd, goalLabel || undefined);
    if (!updated) {
      return NextResponse.json({ error: "Unknown handle." }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Could not save the goal right now." },
      { status: 500 },
    );
  }
}
