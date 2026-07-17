// Client-safe fetchers for tip notes (the fan-facing supporter wall).
// Notes are best-effort social proof — the money itself never touches this API.

export interface TipNote {
  name: string;
  message: string;
  amountUsd: number;
  at: number; // epoch ms
}

/**
 * Post a note alongside a tip. Fire-and-forget friendly: one retry, then
 * every error is swallowed — the tip has already settled by the time this runs.
 */
export async function postTipNote(input: {
  handle: string;
  name: string;
  message: string;
  amountUsd: number;
}): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.ok) return;
    } catch {
      // network hiccup — one retry, then give up quietly
    }
  }
}

export interface TipsSummary {
  notes: TipNote[];
  /** Store-tracked running total of note-attested tips (drives the goal bar). */
  raisedUsd: number;
}

/** Latest notes + raised total for a handle (notes newest first, max 25). */
export async function fetchTipsSummary(handle: string): Promise<TipsSummary> {
  const res = await fetch(`/api/tips?handle=${encodeURIComponent(handle)}`);
  if (!res.ok) throw new Error(`Failed to load tip notes (${res.status})`);
  const body = (await res.json()) as { notes?: TipNote[]; raisedUsd?: number };
  return {
    notes: Array.isArray(body.notes) ? body.notes : [],
    raisedUsd:
      typeof body.raisedUsd === "number" && Number.isFinite(body.raisedUsd)
        ? body.raisedUsd
        : 0,
  };
}

/** Latest notes for a handle (newest first, max 25 per the API). */
export async function fetchTipNotes(handle: string): Promise<TipNote[]> {
  return (await fetchTipsSummary(handle)).notes;
}
