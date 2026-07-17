"use client";

import { useEffect, useRef, useState } from "react";

/** The creator's shareable tip link with copy, native share, QR code, and a $5 request link. */
export default function ShareCard({ handle }: { handle: string }) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [requestCopied, setRequestCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLink(`${window.location.origin}/${handle}`);
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, [handle]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      if (requestResetTimer.current) clearTimeout(requestResetTimer.current);
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

  const copyRequest = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(`${link}?tip=5`);
      setRequestCopied(true);
      if (requestResetTimer.current) clearTimeout(requestResetTimer.current);
      requestResetTimer.current = setTimeout(() => setRequestCopied(false), 2000);
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
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={copyRequest}
          className={`min-h-11 flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors ${
            requestCopied
              ? "border-money text-money"
              : "border-card-border hover:border-brand hover:text-brand"
          }`}
        >
          {requestCopied ? "Copied ✓" : "Copy $5 request link"}
        </button>
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          aria-expanded={showQr}
          className="min-h-11 rounded-xl border border-card-border px-4 py-3 text-sm font-semibold transition-colors hover:border-brand hover:text-brand"
        >
          {showQr ? "Hide QR" : "QR code"}
        </button>
      </div>
      {showQr && link && (
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?data=${encodeURIComponent(link)}&size=240`}
            alt="QR code for your tip link"
            className="mx-auto rounded-xl bg-white p-3"
            width={240}
            height={240}
          />
        </div>
      )}
    </section>
  );
}
