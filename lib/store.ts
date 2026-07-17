// Server-only creator registry: Upstash Redis REST when configured,
// otherwise an in-memory + /tmp-file fallback for local dev.
// (The fallback does NOT persist reliably on serverless — set the two
// UPSTASH_* env vars in production.)
import { readFileSync, writeFileSync } from "node:fs";
import type { Creator } from "./creators";

// Vercel's Upstash marketplace integration injects KV_REST_API_* names;
// a direct Upstash setup uses UPSTASH_REDIS_REST_*. Accept both.
const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const DEV_FILE = "/tmp/tipjet-creators.json";

const key = (handle: string) => `creator:${handle}`;

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
