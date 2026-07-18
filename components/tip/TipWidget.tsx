"use client";

import { useEffect, useMemo, useState } from "react";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import type { Creator } from "@/lib/creators";
import { sendUsdcOnArbitrum } from "@/lib/send";
import { ARBITRUM_CHAIN_ID, chainName } from "@/lib/tokens";

const PRESETS = [1, 5, 10];
const MIN_TIP = 0.5;
const MAX_TIP = 10000;
const NAME_MAX = 24;
const MESSAGE_MAX = 140;
const FAN_NAME_KEY = "tipjet.fanName";
const SENDING_LINES = ["Sending your tip…", "Almost there…"];

type Phase = "idle" | "confirming" | "sending" | "success" | "error";

export default function TipWidget({
  creator,
  ua,
  balanceUsd,
  initialAmount,
  onSent,
  onBalanceRefresh,
}: {
  creator: Creator;
  ua: UniversalAccount;
  balanceUsd: number;
  initialAmount?: number;
  onSent: (result: {
    transactionId: string;
    activityUrl: string;
    amountUsd: number;
    fromChains: number[];
    name: string;
    message: string;
  }) => void;
  onBalanceRefresh: () => void;
}) {
  // A valid ?tip= prefill preselects the amount (preset if it matches one).
  const prefill =
    initialAmount !== undefined &&
    Number.isFinite(initialAmount) &&
    initialAmount >= MIN_TIP &&
    initialAmount <= MAX_TIP
      ? initialAmount
      : null;
  const prefillCustom = prefill !== null && !PRESETS.includes(prefill);

  const [phase, setPhase] = useState<Phase>("idle");
  const [preset, setPreset] = useState<number | null>(
    prefillCustom ? null : (prefill ?? 5),
  );
  const [customMode, setCustomMode] = useState(prefillCustom);
  const [customValue, setCustomValue] = useState(
    prefillCustom ? String(prefill) : "",
  );
  const [fanName, setFanName] = useState("");
  const [fanMessage, setFanMessage] = useState("");
  const [sentFromChains, setSentFromChains] = useState<number[]>([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const amount = useMemo(() => {
    if (customMode) {
      const n = Number.parseFloat(customValue);
      return Number.isFinite(n) ? n : null;
    }
    return preset;
  }, [customMode, customValue, preset]);

  const tooSmall = amount !== null && amount < MIN_TIP;
  const tooBig = amount !== null && amount > balanceUsd;
  const canContinue = amount !== null && !tooSmall && !tooBig;

  // Remember the fan's name across tips (saved back on send).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FAN_NAME_KEY);
      if (stored) setFanName(stored.slice(0, NAME_MAX));
    } catch {
      // storage unavailable — start blank
    }
  }, []);

  // Rotate the reassurance lines while a send is in flight.
  useEffect(() => {
    if (phase !== "sending") return;
    setLineIdx(0);
    const id = window.setInterval(
      () => setLineIdx((i) => Math.min(i + 1, SENDING_LINES.length - 1)),
      3200,
    );
    return () => window.clearInterval(id);
  }, [phase]);

  function pickPreset(n: number) {
    setCustomMode(false);
    setPreset(n);
  }

  function pickCustom() {
    setCustomMode(true);
    setPreset(null);
  }

  function sanitizeAmount(v: string): string {
    const cleaned = v.replace(/[^0-9.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot === -1) return cleaned;
    return (
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "")
    );
  }

  async function handleConfirm() {
    if (amount === null || phase === "sending") return; // guard double-submit
    setPhase("sending");

    const name = fanName.trim().slice(0, NAME_MAX);
    const message = fanMessage.trim().slice(0, MESSAGE_MAX);
    if (name) {
      try {
        window.localStorage.setItem(FAN_NAME_KEY, name);
      } catch {
        // storage unavailable — skip remembering
      }
    }

    try {
      const result = await sendUsdcOnArbitrum(
        ua,
        creator.receivingAddress,
        amount.toString(),
      );
      setSentFromChains(result.fromChains);
      setPhase("success");
      // The note is posted by TipPage AFTER on-chain settlement is observed,
      // with the real tx hash — so the wall/goal can't be forged.
      onSent({ ...result, amountUsd: amount, name, message });
      onBalanceRefresh();
    } catch (e) {
      const err = e as { code?: number; message?: string };
      const outage =
        err?.code === -32653 ||
        (typeof err?.message === "string" &&
          err.message.includes("Insufficient primary token"));
      setErrorMsg(
        outage
          ? "We couldn't move your balance just now — please try again in a few minutes."
          : "We couldn't confirm your tip. Check your balance before trying again.",
      );
      // Re-sync the balance so a retry can't blindly double-send if the first
      // attempt actually moved funds before the error surfaced.
      onBalanceRefresh();
      setPhase("error");
    }
  }

  function resetToIdle() {
    setPhase("idle");
    setCustomMode(false);
    setCustomValue("");
    setPreset(5);
    setFanMessage("");
    setSentFromChains([]);
  }

  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const sourceChainId = sentFromChains.find((id) => id !== ARBITRUM_CHAIN_ID);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-card-border bg-card p-6">
      {phase === "idle" && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((n) => {
              const active = !customMode && preset === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => pickPreset(n)}
                  className={`btn-press rounded-xl py-3 text-lg font-semibold tabular-nums transition ${
                    active
                      ? "bg-brand text-white"
                      : "border border-card-border hover:border-brand"
                  }`}
                >
                  ${n}
                </button>
              );
            })}
            <button
              type="button"
              onClick={pickCustom}
              className={`btn-press rounded-xl py-3 text-sm font-semibold transition ${
                customMode
                  ? "bg-brand text-white"
                  : "border border-card-border hover:border-brand"
              }`}
            >
              Custom
            </button>
          </div>

          {customMode && (
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={customValue}
                onChange={(e) => setCustomValue(sanitizeAmount(e.target.value))}
                placeholder="2.50"
                aria-label="Custom tip amount in dollars"
                className="w-full rounded-xl border border-card-border bg-background py-3 pl-9 pr-4 text-lg font-semibold tabular-nums outline-none transition focus:ring-2 focus:ring-brand"
              />
            </div>
          )}

          {tooBig && (
            <p className="text-center text-sm text-red-500">Not enough balance</p>
          )}
          {tooSmall && customValue !== "" && !tooBig && (
            <p className="text-center text-sm text-muted">Minimum tip is $0.50</p>
          )}

          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setPhase("confirming")}
            className="btn-press rounded-xl bg-brand py-3 text-lg font-semibold text-white transition hover:bg-brand-strong disabled:opacity-40"
          >
            {amount !== null && canContinue ? `Tip ${fmt(amount)}` : "Tip"}
          </button>
        </>
      )}

      {phase === "confirming" && (
        <div className="flex flex-col gap-4 py-2">
          <p className="text-center text-lg font-semibold">
            Send {fmt(amount ?? 0)} to {creator.displayName}?
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={fanName}
              onChange={(e) => setFanName(e.target.value.slice(0, NAME_MAX))}
              placeholder="Your name (optional)"
              maxLength={NAME_MAX}
              aria-label="Your name"
              className="w-full rounded-xl border border-card-border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-brand"
            />
            <textarea
              value={fanMessage}
              onChange={(e) =>
                setFanMessage(
                  e.target.value.replace(/\n/g, " ").slice(0, MESSAGE_MAX),
                )
              }
              placeholder="Say something nice…"
              maxLength={MESSAGE_MAX}
              rows={fanMessage.length > 40 ? 2 : 1}
              aria-label="Leave a message with your tip"
              className="w-full resize-none rounded-xl border border-card-border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPhase("idle")}
              className="flex-1 rounded-xl border border-card-border py-3 font-semibold transition hover:bg-background"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-press flex-1 rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-strong"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {phase === "sending" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="text-muted">{SENDING_LINES[lineIdx]}</p>
        </div>
      )}

      {phase === "success" && (
        <div className="animate-pop flex flex-col items-center gap-2 py-4">
          <p className="font-display text-3xl font-bold">Sent! ❤️</p>
          <p className="text-muted">
            {creator.displayName} just got {fmt(amount ?? 0)}
          </p>
          <div className="mt-2 w-full rounded-xl border border-card-border bg-background px-4 py-3 text-center text-sm text-muted">
            {sourceChainId !== undefined ? (
              <>
                You paid from{" "}
                <span className="font-semibold text-foreground">
                  {chainName(sourceChainId)}
                </span>{" "}
                → {creator.displayName} received dollars on{" "}
                <span className="font-semibold text-foreground">Arbitrum</span>{" "}
                · same account, no bridge.
              </>
            ) : (
              <>
                Paid from your balance → settled on{" "}
                <span className="font-semibold text-foreground">Arbitrum</span>{" "}
                · same account, no bridge.
              </>
            )}
          </div>
          <button
            type="button"
            onClick={resetToIdle}
            className="btn-press mt-2 min-h-[44px] rounded-full px-5 font-semibold text-brand transition hover:bg-background"
          >
            Send another tip
          </button>
        </div>
      )}

      {phase === "error" && (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <p className="font-medium">{errorMsg}</p>
          <button
            type="button"
            onClick={() => setPhase("confirming")}
            className="btn-press w-full rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-strong"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
