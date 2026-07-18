import { NextRequest, NextResponse } from "next/server";
import {
  pushTipNote,
  getTipNotes,
  getRaised,
  getCreator,
  rateLimit,
  consumeTxHash,
} from "@/lib/store";
import { normalizeHandle, isValidHandle, type TipNote } from "@/lib/creators";
import { verifyUsdcTipReceived } from "@/lib/verifyTip";

/**
 * Clean untrusted display text: NFKC-normalize, drop ASCII controls AND unicode
 * format/bidi controls (zero-width, RTL-override, isolates, BOM) that would
 * otherwise slip slurs past the blocklist or garble the wall, collapse runs of
 * whitespace.
 */
function cleanText(input: string): string {
  const normalized = input.normalize("NFKC");
  let out = "";
  for (const ch of normalized) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 32 || code === 127) continue; // C0 + DEL
    if (code >= 0x200b && code <= 0x200f) continue; // zero-width / directional marks
    if (code >= 0x202a && code <= 0x202e) continue; // bidi embeddings/overrides
    if (code >= 0x2066 && code <= 0x2069) continue; // bidi isolates
    if (code === 0xfeff) continue; // BOM / zero-width no-break space
    out += ch;
  }
  return out.replace(/\s+/g, " ");
}

// Minimal public-wall hygiene — not a moderation system (hackathon scope).
const BLOCKED = ["nigger", "faggot", "kike", "chink", "spic", "tranny"];
function containsBlocked(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED.some((w) => lower.includes(w));
}

/**
 * Trusted client IP on Vercel: x-vercel-forwarded-for is set by the platform
 * and cannot be spoofed by the client; fall back to the RIGHTMOST x-forwarded-
 * for entry (the hop Vercel appended) rather than the client-controlled left.
 */
function clientIp(req: NextRequest): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",");
    return parts[parts.length - 1]!.trim();
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
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
    const [notes, raisedUsd] = await Promise.all([
      getTipNotes(handle, 25),
      getRaised(handle),
    ]);
    return NextResponse.json({ notes, raisedUsd });
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
      txHash?: unknown;
    } | null;

    if (!body || typeof body.handle !== "string") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const handle = normalizeHandle(body.handle);
    if (!isValidHandle(handle)) {
      return NextResponse.json({ error: "Invalid handle." }, { status: 400 });
    }
    // Rate-limit before any store writes / RPC calls (4/min/IP).
    if (!(await rateLimit(`tips:${clientIp(req)}`, 4, 60))) {
      return NextResponse.json(
        { error: "Too many notes — try again in a minute." },
        { status: 429 },
      );
    }
    const creator = await getCreator(handle);
    if (!creator) {
      return NextResponse.json({ error: "Unknown creator." }, { status: 404 });
    }
    if (body.name !== undefined && typeof body.name !== "string") {
      return NextResponse.json({ error: "Invalid name." }, { status: 400 });
    }
    if (body.message !== undefined && typeof body.message !== "string") {
      return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    }
    // A note is only ever created for a REAL, settled tip: the client submits
    // the Arbitrum tx hash and the server confirms it on-chain. This is what
    // makes the "raised" total and the wall unforgeable — the amount comes from
    // the chain, never from the caller.
    if (typeof body.txHash !== "string") {
      return NextResponse.json(
        { error: "A settled tip is required." },
        { status: 400 },
      );
    }
    const amountUsd = await verifyUsdcTipReceived(
      body.txHash,
      creator.receivingAddress,
    );
    if (amountUsd === null) {
      return NextResponse.json(
        { error: "Couldn't verify that tip on-chain." },
        { status: 400 },
      );
    }
    // Each settlement can be counted exactly once (replay / double-credit guard).
    if (!(await consumeTxHash(body.txHash))) {
      return NextResponse.json(
        { error: "That tip was already recorded." },
        { status: 409 },
      );
    }

    const name =
      cleanText(typeof body.name === "string" ? body.name : "")
        .trim()
        .slice(0, 24)
        .trim() || "Someone";
    const message = cleanText(
      typeof body.message === "string" ? body.message : "",
    )
      .trim()
      .slice(0, 140)
      .trim();

    if (containsBlocked(name) || containsBlocked(message)) {
      return NextResponse.json(
        { error: "That note can't be posted." },
        { status: 400 },
      );
    }

    const note: TipNote = {
      name,
      message,
      amountUsd: Math.round(amountUsd * 100) / 100,
      at: Date.now(),
    };
    await pushTipNote(handle, note);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not save that note right now." },
      { status: 500 },
    );
  }
}
