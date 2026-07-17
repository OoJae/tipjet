// Shared creator types + client-side fetch helpers (safe in client components).

export interface Creator {
  handle: string; // lowercase, no @
  displayName: string;
  receivingAddress: string; // 0x… on Arbitrum (their Magic/UA address or any wallet)
  createdAt: number;
}

export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

/** Route names and app words a creator must not claim as a handle. */
export const RESERVED_HANDLES = new Set([
  "dashboard",
  "claim",
  "dev",
  "api",
  "about",
  "admin",
  "settings",
  "help",
  "tipjet",
]);

export function isValidHandle(handle: string): boolean {
  return /^[a-z0-9_]{2,24}$/.test(handle) && !RESERVED_HANDLES.has(handle);
}

export async function fetchCreator(handle: string): Promise<Creator | null> {
  const res = await fetch(`/api/creators?handle=${encodeURIComponent(handle)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load creator (${res.status})`);
  return res.json();
}

export async function claimHandle(input: {
  handle: string;
  displayName: string;
  receivingAddress: string;
}): Promise<Creator> {
  const res = await fetch("/api/creators", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 409) throw new Error("That handle is already taken.");
  if (!res.ok) throw new Error(body?.error ?? `Could not claim handle (${res.status})`);
  return body;
}
