import { NextRequest, NextResponse } from "next/server";
import { getCreator, updateCreatorGoal } from "@/lib/store";
import { normalizeHandle, isValidHandle } from "@/lib/creators";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      handle?: unknown;
      receivingAddress?: unknown;
      goalUsd?: unknown;
      goalLabel?: unknown;
    } | null;

    if (
      !body ||
      typeof body.handle !== "string" ||
      typeof body.receivingAddress !== "string"
    ) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
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

    const creator = await getCreator(handle);
    if (!creator) {
      return NextResponse.json({ error: "Unknown handle." }, { status: 404 });
    }
    if (
      creator.receivingAddress.toLowerCase() !==
      body.receivingAddress.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: "This handle isn't linked to that account." },
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
