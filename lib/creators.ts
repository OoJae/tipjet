// Shared creator types + client-side fetch helpers (safe in client components).

export interface Creator {
  handle: string; // lowercase, no @
  displayName: string;
  receivingAddress: string; // 0x… on Arbitrum (their Magic/UA address or any wallet)
  createdAt: number;
  goalUsd?: number; // optional tip goal in USD
  goalLabel?: string; // what the goal is for, ≤40 chars
}

/** A note a fan leaves with a tip. `at` is epoch ms. */
export interface TipNote {
  name: string;
  message: string;
  amountUsd: number;
  at: number;
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

/** The creator a login address owns, if any (authoritative identity). */
export async function fetchCreatorByAddress(
  address: string,
): Promise<Creator | null> {
  const res = await fetch(`/api/creators?address=${encodeURIComponent(address)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to resolve account (${res.status})`);
  return res.json();
}

/** The exact message a claimer's wallet signs to prove control of the payout address. */
export function claimSignaturePayload(
  handle: string,
  displayName: string,
  receivingAddress: string,
  ts: number,
): string {
  return `TipJet claim\nhandle: ${handle}\nname: ${displayName}\naddress: ${receivingAddress}\nts: ${ts}`;
}

export async function claimHandle(input: {
  handle: string;
  displayName: string;
  receivingAddress: string;
  /** Signs the claim with the payout wallet (the Magic signer). */
  signMessage: (message: string) => Promise<string>;
}): Promise<Creator> {
  // Normalize/trim EXACTLY as the server will, so the signed payload matches.
  const handle = normalizeHandle(input.handle);
  const displayName = input.displayName.trim();
  const receivingAddress = input.receivingAddress.trim();
  const ts = Date.now();
  const signature = await input.signMessage(
    claimSignaturePayload(handle, displayName, receivingAddress, ts),
  );
  const res = await fetch("/api/creators", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle, displayName, receivingAddress, ts, signature }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 409) throw new Error("That handle is already taken.");
  if (!res.ok) throw new Error(body?.error ?? `Could not claim handle (${res.status})`);
  return body;
}

/** The exact message a creator's wallet signs to authorize a goal change. */
export function goalSignaturePayload(
  handle: string,
  goalUsd: number,
  goalLabel: string,
  ts: number,
): string {
  return `TipJet goal update\nhandle: ${handle}\ngoal: ${goalUsd}\nlabel: ${goalLabel}\nts: ${ts}`;
}

export async function setCreatorGoal(input: {
  handle: string;
  goalUsd: number;
  goalLabel?: string;
  /** Signs with the creator's wallet (e.g. Magic signer's signMessage). */
  signMessage: (message: string) => Promise<string>;
}): Promise<Creator> {
  const ts = Date.now();
  // Normalize EXACTLY like the server does before verifying, or the
  // signature won't recover to the same payload.
  const goalUsd = Math.round(input.goalUsd * 100) / 100;
  const goalLabel = (input.goalLabel?.trim() ?? "").slice(0, 40);
  const signature = await input.signMessage(
    goalSignaturePayload(normalizeHandle(input.handle), goalUsd, goalLabel, ts),
  );
  const res = await fetch("/api/creators/goal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle: input.handle, goalUsd, goalLabel, ts, signature }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 403 || res.status === 404) {
    throw new Error("This handle isn't linked to your account.");
  }
  if (!res.ok) {
    throw new Error(body?.error ?? `Could not save your goal (${res.status})`);
  }
  return body;
}
