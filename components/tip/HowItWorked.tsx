"use client";

import { useState } from "react";

export default function HowItWorked({ name }: { name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="animate-pop rounded-2xl border border-card-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-center justify-between rounded-2xl px-5 py-4 text-left font-semibold transition hover:bg-background"
      >
        <span>How did that work? ✨</span>
        <span
          className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-4 px-5 pb-5">
          <p className="text-sm leading-relaxed text-muted">
            You paid from your one balance. {name} received real US dollars on
            Arbitrum — instantly, at the same account they always use. No forms.
            No waiting. That&apos;s TipJet.
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span aria-hidden>🔑</span>
              <span>One login — powered by Magic</span>
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden>💜</span>
              <span>One balance — powered by Particle Universal Accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <span aria-hidden>⚡</span>
              <span>One settlement — on Arbitrum</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
