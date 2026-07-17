"use client";

import { useEffect, useState } from "react";
import { fetchTipNotes, type TipNote } from "@/lib/tips";

const POLL_MS = 20_000;
const MAX_NOTES = 25;

interface WallNote extends TipNote {
  id: string;
  isNew: boolean; // arrived since the last poll (vs. initial load)
}

function relativeTime(at: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Social-proof wall of recent tip notes — names and kind words only, never addresses. */
export default function SupporterWall({ handle }: { handle: string }) {
  // undefined = first load in flight
  const [notes, setNotes] = useState<WallNote[]>();

  useEffect(() => {
    if (!handle) return;

    let cancelled = false;
    let busy = false; // guard against overlapping polls
    let initialized = false; // first successful load done
    const seen = new Set<string>();

    const poll = async () => {
      if (busy || cancelled) return;
      busy = true;
      try {
        const fetched = await fetchTipNotes(handle);
        if (cancelled) return;
        const batchIds = new Set<string>();
        const mapped: WallNote[] = fetched.slice(0, MAX_NOTES).map((n) => {
          let id = `${n.at}:${n.name}:${n.amountUsd}:${n.message}`;
          for (let i = 1; batchIds.has(id); i++) {
            id = `${n.at}:${n.name}:${n.amountUsd}:${n.message}#${i}`;
          }
          batchIds.add(id);
          return { ...n, id, isNew: initialized && !seen.has(id) };
        });
        for (const n of mapped) seen.add(n.id);
        initialized = true;
        setNotes(mapped);
      } catch {
        // transient hiccup — keep what we have and retry on the next tick
      } finally {
        busy = false;
      }
    };

    poll();
    const timer = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [handle]);

  const now = Date.now();

  return (
    <section className="rounded-2xl border border-card-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        Recent supporters ❤️
      </h2>
      {notes === undefined ? (
        <p className="mt-4 animate-pulse text-sm text-muted">
          Gathering the love…
        </p>
      ) : notes.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Be the first to leave a note ❤️
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-card-border">
          {notes.map((note) => (
            <li
              key={note.id}
              className={`py-3 ${note.isNew ? "animate-pop" : ""}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate font-semibold">{note.name}</p>
                <p className="shrink-0 font-semibold tabular-nums text-money">
                  ${note.amountUsd.toFixed(2)}
                </p>
              </div>
              {note.message !== "" && (
                <p className="mt-0.5 break-words text-sm italic text-muted">
                  {note.message}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted">
                {relativeTime(note.at, now)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
