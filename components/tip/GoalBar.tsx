"use client";

import { useEffect, useState } from "react";
import { fetchTipsSummary } from "@/lib/tips";

const POLL_MS = 20_000;

function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Subtle progress bar toward a creator's tip goal.
 *
 * Reads the store-tracked running total (incremented as tips post their notes)
 * rather than scanning chain logs from every visitor's browser: it never
 * resets with a block window, ignores self-deposits, and costs one tiny API
 * call. Polls so the bar visibly moves after a tip.
 */
export default function GoalBar({
  goalUsd,
  goalLabel,
  handle,
}: {
  goalUsd: number;
  goalLabel?: string;
  handle: string;
}) {
  // undefined = first load in flight
  const [raisedUsd, setRaisedUsd] = useState<number>();

  useEffect(() => {
    let cancelled = false;
    let busy = false;
    const load = async () => {
      if (busy || cancelled) return;
      busy = true;
      try {
        const { raisedUsd: raised } = await fetchTipsSummary(handle);
        if (!cancelled) setRaisedUsd(raised);
      } catch {
        // keep the previous number; first-load failure shows an unfilled bar
        if (!cancelled) setRaisedUsd((prev) => prev ?? 0);
      } finally {
        busy = false;
      }
    };
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [handle]);

  const loading = raisedUsd === undefined;
  const pct = loading ? 0 : Math.min((raisedUsd / goalUsd) * 100, 100);

  return (
    <div className="w-full">
      {!loading && (
        <p className="mb-1.5 text-sm">
          <span className="font-semibold">{goalLabel ?? "Tip goal"}</span>
          <span className="text-muted"> — </span>
          <span className="font-semibold tabular-nums text-money">
            ${fmtUsd(raisedUsd)}
          </span>
          <span className="text-muted"> of ${fmtUsd(goalUsd)}</span>
        </p>
      )}
      <div
        className={`h-2 w-full overflow-hidden rounded-full border border-card-border bg-background ${
          loading ? "animate-pulse" : ""
        }`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goalUsd}
        aria-valuenow={loading ? undefined : Math.min(raisedUsd, goalUsd)}
        aria-label={goalLabel ?? "Tip goal"}
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
