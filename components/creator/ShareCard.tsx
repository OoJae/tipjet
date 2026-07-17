"use client";

import { useEffect, useRef, useState } from "react";

/** The creator's shareable tip link with copy + native share. */
export default function ShareCard({ handle }: { handle: string }) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLink(`${window.location.origin}/${handle}`);
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, [handle]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — nothing to do */
    }
  };

  const share = async () => {
    if (!link) return;
    try {
      await navigator.share({ title: "Tip me on TipJet", url: link });
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <section className="rounded-2xl border border-card-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        Your tip link
      </h2>
      <p className="mt-2 break-all font-mono text-sm font-medium">
        {link.replace(/^https?:\/\//, "")}
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={copy}
          className={`min-h-11 flex-1 rounded-xl py-3 font-semibold text-white transition-colors ${
            copied ? "bg-money" : "bg-brand hover:bg-brand-strong"
          }`}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={share}
            className="min-h-11 rounded-xl border border-card-border px-5 py-3 font-semibold transition-colors hover:border-brand hover:text-brand"
          >
            Share
          </button>
        )}
      </div>
    </section>
  );
}
