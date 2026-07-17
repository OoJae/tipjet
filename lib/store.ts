// Server-only creator registry: Upstash Redis REST when configured,
// otherwise an in-memory + /tmp-file fallback for local dev.
// (The fallback does NOT persist reliably on serverless — set the two
// UPSTASH_* env vars in production.)
import { readFileSync, writeFileSync } from "node:fs";
import type { Creator, TipNote } from "./creators";

// Vercel's Upstash marketplace integration injects KV_REST_API_* names;
// a direct Upstash setup uses UPSTASH_REDIS_REST_*. Accept both.
const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const DEV_FILE = "/tmp/tipjet-creators.json";
const NOTES_DEV_FILE = "/tmp/tipjet-tipnotes.json";
const NOTES_MAX = 100;

const key = (handle: string) => `creator:${handle}`;
const notesKey = (handle: string) => `tips:${handle}`;

async function upstash(cmd: unknown[]): Promise<unknown> {
  const res = await fetch(UPSTASH_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const body = (await res.json()) as { result: unknown; error?: string };
  if (body.error) throw new Error(`Upstash: ${body.error}`);
  return body.result;
}

// --- dev fallback (module-level Map, mirrored to /tmp for reload survival) ---
function devLoad(): Map<string, Creator> {
  try {
    const raw = JSON.parse(readFileSync(DEV_FILE, "utf8")) as Creator[];
    return new Map(raw.map((c) => [c.handle, c]));
  } catch {
    return new Map();
  }
}
const devStore: Map<string, Creator> = devLoad();
function devPersist() {
  try {
    writeFileSync(DEV_FILE, JSON.stringify([...devStore.values()]));
  } catch {
    /* best-effort */
  }
}

function devLoadNotes(): Map<string, TipNote[]> {
  try {
    const raw = JSON.parse(readFileSync(NOTES_DEV_FILE, "utf8")) as Record<
      string,
      TipNote[]
    >;
    return new Map(Object.entries(raw));
  } catch {
    return new Map();
  }
}
const devNotes: Map<string, TipNote[]> = devLoadNotes();
function devPersistNotes() {
  try {
    writeFileSync(NOTES_DEV_FILE, JSON.stringify(Object.fromEntries(devNotes)));
  } catch {
    /* best-effort */
  }
}

export function usingUpstash(): boolean {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

/** On Vercel, silently falling back to per-lambda memory would lose registrations. */
function assertProductionStore() {
  if (!usingUpstash() && process.env.VERCEL) {
    throw new Error(
      "Creator registry misconfigured: set UPSTASH_REDIS_REST_URL/TOKEN (or connect the Upstash Vercel integration).",
    );
  }
}

export async function getCreator(handle: string): Promise<Creator | null> {
  assertProductionStore();
  if (usingUpstash()) {
    const raw = (await upstash(["GET", key(handle)])) as string | null;
    return raw ? (JSON.parse(raw) as Creator) : null;
  }
  return devStore.get(handle) ?? null;
}

/** Create the creator iff the handle is free. Returns null if taken. */
export async function createCreator(creator: Creator): Promise<Creator | null> {
  assertProductionStore();
  if (usingUpstash()) {
    const set = (await upstash(["SET", key(creator.handle), JSON.stringify(creator), "NX"])) as
      | string
      | null;
    return set === "OK" ? creator : null;
  }
  if (devStore.has(creator.handle)) return null;
  devStore.set(creator.handle, creator);
  devPersist();
  return creator;
}

/**
 * Merge goal fields onto an existing creator (plain SET — the record already
 * exists). goalUsd 0 clears both goal fields. Returns null if the handle is
 * unknown.
 */
export async function updateCreatorGoal(
  handle: string,
  goalUsd: number,
  goalLabel?: string,
): Promise<Creator | null> {
  assertProductionStore();
  const creator = await getCreator(handle);
  if (!creator) return null;

  const updated: Creator = { ...creator };
  if (goalUsd === 0) {
    delete updated.goalUsd;
    delete updated.goalLabel;
  } else {
    updated.goalUsd = goalUsd;
    if (goalLabel) updated.goalLabel = goalLabel;
    else delete updated.goalLabel;
  }

  if (usingUpstash()) {
    await upstash(["SET", key(handle), JSON.stringify(updated)]);
  } else {
    devStore.set(handle, updated);
    devPersist();
  }
  return updated;
}

/** Prepend a fan's note to the creator's list, keeping the newest NOTES_MAX. */
export async function pushTipNote(handle: string, note: TipNote): Promise<void> {
  assertProductionStore();
  if (usingUpstash()) {
    await upstash(["LPUSH", notesKey(handle), JSON.stringify(note)]);
    await upstash(["LTRIM", notesKey(handle), 0, NOTES_MAX - 1]);
    return;
  }
  const list = devNotes.get(handle) ?? [];
  list.unshift(note);
  devNotes.set(handle, list.slice(0, NOTES_MAX));
  devPersistNotes();
}

/** Newest-first notes for a handle. */
export async function getTipNotes(
  handle: string,
  limit = 25,
): Promise<TipNote[]> {
  assertProductionStore();
  if (usingUpstash()) {
    const raw = (await upstash([
      "LRANGE",
      notesKey(handle),
      0,
      limit - 1,
    ])) as string[];
    return raw.map((item) => JSON.parse(item) as TipNote);
  }
  return (devNotes.get(handle) ?? []).slice(0, limit);
}
