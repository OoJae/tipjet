"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { loginEmail, isLoggedIn, getAddress, logout } from "@/lib/magic";
import {
  makeUniversalAccount,
  getUnifiedBalance,
} from "@/lib/universalAccount";
import { sendUsdcOnArbitrum } from "@/lib/send";
import { normalizeHandle, isValidHandle } from "@/lib/creators";
import ShareCard from "./ShareCard";
import TipFeed from "./TipFeed";

type Phase = "checking" | "login" | "ready";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const AMOUNT_RE = /^\d*\.?\d+$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const HANDLE_KEY = "tipjet.handle";
const OUTAGE_MESSAGE =
  "We couldn't move your balance just now — please try again in a few minutes.";

export default function Dashboard() {
  const [phase, setPhase] = useState<Phase>("checking");

  // Auth
  const [email, setEmail] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const uaRef = useRef<UniversalAccount | null>(null);

  // Balance
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Handle / share link
  const [handle, setHandle] = useState<string | null>(null);
  const [handleInput, setHandleInput] = useState("");

  // Withdraw
  const [dest, setDest] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState("");
  const [sendDone, setSendDone] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    const ua = uaRef.current;
    if (!ua) return;
    setBalanceLoading(true);
    try {
      const { totalUsd } = await getUnifiedBalance(ua);
      setBalance(totalUsd);
    } catch {
      /* keep the last known balance; user can refresh */
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const ready = useCallback(
    (eoa: string) => {
      uaRef.current = makeUniversalAccount(eoa);
      setAddress(eoa);
      setPhase("ready");
      void refreshBalance();
    },
    [refreshBalance],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HANDLE_KEY);
      if (saved && isValidHandle(saved)) setHandle(saved);
    } catch {
      /* localStorage unavailable */
    }

    let cancelled = false;
    (async () => {
      try {
        const logged = await isLoggedIn();
        if (cancelled) return;
        if (!logged) {
          setPhase("login");
          return;
        }
        const eoa = await getAddress();
        if (!cancelled) ready(eoa);
      } catch {
        if (!cancelled) setPhase("login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const handleLogin = async () => {
    if (loggingIn || !EMAIL_RE.test(email.trim())) return;
    setLoggingIn(true);
    setLoginError(null);
    try {
      const eoa = await loginEmail(email.trim());
      ready(eoa);
    } catch {
      setLoginError("We couldn't sign you in — please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const signOut = async () => {
    try {
      await logout();
    } catch {
      /* session already gone */
    }
    uaRef.current = null;
    setAddress("");
    setBalance(null);
    setEmail("");
    setDest("");
    setAmount("");
    setSendDone(false);
    setSendError(null);
    setPhase("login");
  };

  const saveHandle = () => {
    const normalized = normalizeHandle(handleInput);
    if (!isValidHandle(normalized)) return;
    setHandle(normalized);
    setHandleInput("");
    try {
      localStorage.setItem(HANDLE_KEY, normalized);
    } catch {
      /* non-fatal */
    }
  };

  const canWithdraw =
    !sending &&
    ADDRESS_RE.test(dest.trim()) &&
    AMOUNT_RE.test(amount.trim()) &&
    Number(amount) > 0;

  const handleWithdraw = async () => {
    const ua = uaRef.current;
    if (!ua || !canWithdraw) return;
    setSending(true);
    setSendDone(false);
    setSendError(null);
    setSendStatus("Preparing…");
    try {
      await sendUsdcOnArbitrum(ua, dest.trim(), amount.trim(), (m) =>
        setSendStatus(m),
      );
      setSendDone(true);
      setAmount("");
      void refreshBalance();
    } catch (e) {
      const err = e as { code?: number | string; message?: string };
      const message = typeof err?.message === "string" ? err.message : "";
      if (err?.code === -32653 || message.includes("Insufficient primary token")) {
        setSendError(OUTAGE_MESSAGE);
      } else {
        setSendError("Something went wrong sending your money — please try again.");
      }
    } finally {
      setSending(false);
      setSendStatus("");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-4 py-8">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight transition-opacity hover:opacity-80"
          >
            Tip<span className="text-brand">Jet</span>
          </Link>
          {phase === "ready" && (
            <button
              type="button"
              onClick={signOut}
              className="rounded-full px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          )}
        </header>

        {phase === "checking" && (
          <p className="mt-24 animate-pulse text-center text-muted">
            Loading your dashboard…
          </p>
        )}

        {phase === "login" && (
          <section className="mt-12">
            <h1 className="text-3xl font-bold tracking-tight">
              Your dashboard
            </h1>
            <p className="mt-2 text-muted">
              Sign in with your email to see your balance and tips.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                autoComplete="email"
                className="mt-6 min-h-14 w-full rounded-xl border border-card-border bg-card px-4 py-3 text-lg outline-none placeholder:text-muted/60 focus:border-brand"
              />
              <button
                type="submit"
                disabled={!EMAIL_RE.test(email.trim()) || loggingIn}
                className="mt-4 min-h-12 w-full rounded-xl bg-brand py-3 font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-40"
              >
                {loggingIn ? "Signing in…" : "Continue with email"}
              </button>
            </form>
            {loginError && (
              <p className="mt-4 text-sm font-semibold text-red-500">
                {loginError}
              </p>
            )}
            <p className="mt-8 text-center text-sm text-muted">
              New here?{" "}
              <Link
                href="/claim"
                className="font-semibold text-brand hover:underline"
              >
                Claim your link
              </Link>
            </p>
          </section>
        )}

        {phase === "ready" && (
          <div className="mt-6 space-y-4">
            {/* Balance */}
            <section className="rounded-3xl border border-card-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Your balance
                </h2>
                <button
                  type="button"
                  onClick={() => void refreshBalance()}
                  disabled={balanceLoading}
                  aria-label="Refresh balance"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground disabled:opacity-40"
                >
                  ↻
                </button>
              </div>
              <p
                className={`mt-2 text-5xl font-bold tabular-nums tracking-tight ${
                  balanceLoading && balance === null ? "animate-pulse text-muted" : ""
                }`}
              >
                {balance === null
                  ? "$—"
                  : `$${balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </p>
              <p className="mt-2 text-xs text-muted">
                Settled on Arbitrum ✓
              </p>
            </section>

            {/* Share link */}
            {handle ? (
              <div>
                <ShareCard handle={handle} />
                <button
                  type="button"
                  onClick={() => {
                    setHandle(null);
                    try {
                      localStorage.removeItem(HANDLE_KEY);
                    } catch {
                      /* non-fatal */
                    }
                  }}
                  className="mt-2 px-1 py-2 text-xs font-semibold text-muted transition-colors hover:text-foreground"
                >
                  Change handle
                </button>
              </div>
            ) : (
              <section className="rounded-2xl border border-card-border bg-card p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  Your tip link
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Enter the handle you claimed to show your share link.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveHandle();
                  }}
                  className="mt-3 flex gap-2"
                >
                  <div className="flex flex-1 items-center rounded-xl border border-card-border bg-background px-3 focus-within:border-brand">
                    <span className="font-semibold text-muted">@</span>
                    <input
                      value={handleInput}
                      onChange={(e) => setHandleInput(e.target.value)}
                      placeholder="yourname"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className="min-h-11 w-full bg-transparent px-1.5 py-2 font-semibold outline-none placeholder:font-normal placeholder:text-muted/60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!isValidHandle(normalizeHandle(handleInput))}
                    className="min-h-11 rounded-xl bg-brand px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-40"
                  >
                    Save
                  </button>
                </form>
                <p className="mt-3 text-xs text-muted">
                  No handle yet?{" "}
                  <Link
                    href="/claim"
                    className="font-semibold text-brand hover:underline"
                  >
                    Claim one
                  </Link>
                </p>
              </section>
            )}

            {/* Live tips */}
            <TipFeed address={address} />

            {/* Withdraw */}
            <section className="rounded-2xl border border-card-border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Withdraw
              </h2>
              <p className="mt-2 text-sm text-muted">
                Send money from your balance to any address on Arbitrum.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleWithdraw();
                }}
                className="mt-4 space-y-3"
              >
                <input
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  placeholder="Destination address (0x…)"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-h-12 w-full rounded-xl border border-card-border bg-background px-4 py-3 font-mono text-sm outline-none placeholder:font-sans placeholder:text-muted/60 focus:border-brand"
                />
                <div className="flex items-center rounded-xl border border-card-border bg-background px-4 focus-within:border-brand">
                  <span className="text-lg font-semibold text-muted">$</span>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="min-h-12 w-full bg-transparent px-2 py-3 text-lg font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted/60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canWithdraw}
                  className="min-h-12 w-full rounded-xl bg-brand py-3 font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-40"
                >
                  {sending ? "Sending…" : "Withdraw"}
                </button>
              </form>
              {sending && sendStatus && (
                <p className="mt-3 animate-pulse text-sm text-muted">
                  {sendStatus}
                </p>
              )}
              {sendDone && (
                <p className="mt-3 animate-pop text-sm font-semibold text-money">
                  Sent — settled on Arbitrum ✓
                </p>
              )}
              {sendError && (
                <p className="mt-3 text-sm font-semibold text-red-500">
                  {sendError}
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
