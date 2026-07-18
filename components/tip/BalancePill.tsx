"use client";

import { useEffect, useRef, useState } from "react";

const COUNT_UP_MS = 700;

export default function BalancePill({
  usd,
  onRefresh,
}: {
  usd: number | undefined;
  onRefresh: () => void;
}) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  // ~700ms ease-out count-up whenever the real value changes (rAF, no deps).
  useEffect(() => {
    if (usd === undefined) return;
    const from = displayRef.current;
    const to = usd;
    if (from === to) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const v = from + (to - from) * eased;
      displayRef.current = v;
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [usd]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="inline-flex items-center gap-3 rounded-full border border-card-border bg-card py-2 pl-5 pr-2">
        <span className="font-display text-2xl font-bold">
          {usd === undefined ? (
            <span className="animate-pulse text-muted">$ —</span>
          ) : (
            `$${display.toFixed(2)}`
          )}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh balance"
          title="Refresh balance"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition hover:bg-background hover:text-foreground"
        >
          ↻
        </button>
      </div>
      <p className="text-xs text-muted">
        Your balance — everything you have, in one number.
      </p>
    </div>
  );
}
