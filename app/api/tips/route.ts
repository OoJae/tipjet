import { NextRequest, NextResponse } from "next/server";
import { pushTipNote, getTipNotes } from "@/lib/store";
import { normalizeHandle, isValidHandle, type TipNote } from "@/lib/creators";

/** Drop ASCII control characters (incl. newlines) so notes render cleanly. */
function stripControlChars(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 32 && code !== 127) out += ch;
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("handle");
    if (!raw) {
      return NextResponse.json({ error: "Missing handle." }, { status: 400 });
    }
    const handle = normalizeHandle(raw);
    if (!isValidHandle(handle)) {
      return NextResponse.json({ error: "Invalid handle." }, { status: 400 });
    }
    const notes = await getTipNotes(handle, 25);
    return NextResponse.json({ notes });
  } catch {
    return NextResponse.json(
      { error: "Could not load notes right now." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      handle?: unknown;
      name?: unknown;
      message?: unknown;
      amountUsd?: unknown;
    } | null;

    if (!body || typeof body.handle !== "string") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const handle = normalizeHandle(body.handle);
    if (!isValidHandle(handle)) {
      return NextResponse.json({ error: "Invalid handle." }, { status: 400 });
    }
    if (body.name !== undefined && typeof body.name !== "string") {
      return NextResponse.json({ error: "Invalid name." }, { status: 400 });
    }
    if (body.message !== undefined && typeof body.message !== "string") {
      return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    }
    if (typeof body.amountUsd !== "number" || !Number.isFinite(body.amountUsd)) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }
    const amountUsd = Math.round(body.amountUsd * 100) / 100;
    if (amountUsd < 0.5 || amountUsd > 10000) {
      return NextResponse.json(
        { error: "Amount must be between $0.50 and $10,000." },
        { status: 400 },
      );
    }

    const name =
      stripControlChars(typeof body.name === "string" ? body.name : "")
        .trim()
        .slice(0, 24)
        .trim() || "Someone";
    const message = stripControlChars(
      typeof body.message === "string" ? body.message : "",
    )
      .trim()
      .slice(0, 140)
      .trim();

    const note: TipNote = { name, message, amountUsd, at: Date.now() };
    await pushTipNote(handle, note);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not save that note right now." },
      { status: 500 },
    );
  }
}
