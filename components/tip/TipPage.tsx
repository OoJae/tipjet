"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { fetchCreator, normalizeHandle, type Creator } from "@/lib/creators";
import { isLoggedIn, getAddress, logout } from "@/lib/magic";
import { makeUniversalAccount, getUnifiedBalance } from "@/lib/universalAccount";
import { watchForSettlement } from "@/lib/settlement";
import { postTipNote } from "@/lib/tips";
import PlaneMark from "@/components/brand/PlaneMark";
import Wordmark from "@/components/brand/Wordmark";
import LoginButton from "@/components/tip/LoginButton";
import BalancePill from "@/components/tip/BalancePill";
import TipWidget from "@/components/tip/TipWidget";
import SettledToast from "@/components/tip/SettledToast";
import HowItWorked from "@/components/tip/HowItWorked";
import SupporterWall from "@/components/tip/SupporterWall";
import GoalBar from "@/components/tip/GoalBar";
import { fireConfetti } from "@/components/tip/confetti";

type SentResult = {
  transactionId: string;
  activityUrl: string;
  amountUsd: number;
  fromChains: number[];
  name: string;
  message: string;
};

export default function TipPage({ handle }: { handle: string }) {
  // undefined = loading, null = not found
  const [creator, setCreator] = useState<Creator | null | undefined>(undefined);
  const [ua, setUa] = useState<UniversalAccount>();
  const [eoa, setEoa] = useState<string>();
  const [balanceUsd, setBalanceUsd] = useState<number>();
  const [balanceError, setBalanceError] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sent, setSent] = useState<SentResult>();
  const [toastVisible, setToastVisible] = useState(false);
  const [arbiscanUrl, setArbiscanUrl] = useState<string>();
  const [showTopUp, setShowTopUp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [initialAmount, setInitialAmount] = useState<number>();

  // Prefill links: /handle?tip=2.50 preselects the amount in the widget.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("tip");
    if (!raw) return;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0.5 && n <= 10000) setInitialAmount(n);
  }, []);

  // 1) Load the creator for this handle.
  useEffect(() => {
    let alive = true;
    fetchCreator(normalizeHandle(handle))
      .then((c) => {
        if (alive) setCreator(c);
      })
      .catch(() => {
        if (alive) setCreator(null);
      });
    return () => {
      alive = false;
    };
  }, [handle]);

  const refreshBalance = useCallback(async (account: UniversalAccount) => {
    try {
      const { totalUsd } = await getUnifiedBalance(account);
      setBalanceUsd(totalUsd);
      setBalanceError(false);
    } catch {
      // Surface a retry card only when we have nothing to show yet.
      setBalanceUsd((prev) => {
        if (prev === undefined) setBalanceError(true);
        return prev;
      });
    }
  }, []);

  const initAccount = useCallback(
    async (address: string) => {
      const account = makeUniversalAccount(address);
      setEoa(address);
      setUa(account);
      await refreshBalance(account);
    },
    [refreshBalance],
  );

  // 2) Resume an existing login silently (Magic sessions persist across reloads).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (await isLoggedIn()) {
          const address = await getAddress();
          if (!alive) return;
          await initAccount(address);
        }
      } catch {
        // no session — the fan will log in below
      } finally {
        if (alive) setBootstrapping(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [initAccount]);

  function handleSent(result: SentResult) {
    setSent(result);
    setToastVisible(true);
    setArbiscanUrl(undefined);
    fireConfetti();
    // Once the settlement transfer is observed on Arbitrum: (1) upgrade the
    // toast to a verifiable Arbiscan link, and (2) post the supporter-wall note
    // with the REAL tx hash — the server re-verifies it on-chain before the
    // note counts, so the wall and goal can't be forged.
    if (creator) {
      const handle = creator.handle;
      watchForSettlement({
        receiver: creator.receivingAddress,
        amountUsdc: result.amountUsd,
        onSettled: (txHash) => {
          setArbiscanUrl(`https://arbiscan.io/tx/${txHash}`);
          void postTipNote({
            handle,
            name: result.name,
            message: result.message,
            txHash,
          });
        },
      });
    }
  }

  async function handleCopyAddress() {
    if (!eoa) return;
    try {
      await navigator.clipboard.writeText(eoa);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the address is selectable
    }
  }

  async function handleSignOut() {
    try {
      await logout();
    } catch {
      // ignore — clear local state regardless
    }
    setUa(undefined);
    setEoa(undefined);
    setBalanceUsd(undefined);
    setBalanceError(false);
    setSent(undefined);
    setToastVisible(false);
    setArbiscanUrl(undefined);
    setShowTopUp(false);
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (creator === undefined) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
        <p className="animate-pulse text-muted">Loading…</p>
      </main>
    );
  }

  // ── Unknown handle ─────────────────────────────────────────────────────
  if (creator === null) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <PlaneMark size={64} className="mx-auto -rotate-12" />
        <h1 className="font-display text-2xl font-bold tracking-tight">
          This TipJet doesn&apos;t exist yet
        </h1>
        <p className="text-muted">
          The link may be mistyped — or the person you&apos;re looking for
          hasn&apos;t claimed it.
        </p>
        <Link
          href="/"
          className="btn-press mt-2 rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-strong"
        >
          Take me home
        </Link>
      </main>
    );
  }

  // ── The tip page ───────────────────────────────────────────────────────
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-10">
      <Link
        href="/"
        aria-label="TipJet home"
        className="self-start opacity-80 transition hover:opacity-100"
      >
        <Wordmark size={20} />
      </Link>

      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-strong text-3xl font-bold text-white">
          {creator.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm text-muted">@{creator.handle}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {creator.displayName}
          </h1>
        </div>
        <p className="text-muted">Leave {creator.displayName} a tip 💜</p>
      </header>

      {creator.goalUsd !== undefined && creator.goalUsd > 0 && (
        <GoalBar
          goalUsd={creator.goalUsd}
          goalLabel={creator.goalLabel}
          handle={creator.handle}
        />
      )}

      {bootstrapping && !ua ? (
        <div className="animate-pulse rounded-3xl border border-card-border bg-card p-6 text-center text-muted">
          One moment…
        </div>
      ) : !ua ? (
        <LoginButton onLoggedIn={initAccount} />
      ) : (
        <>
          <BalancePill usd={balanceUsd} onRefresh={() => refreshBalance(ua)} />

          {balanceError && balanceUsd === undefined ? (
            <div className="rounded-3xl border border-card-border bg-card p-6 text-center">
              <p className="font-semibold">We couldn&apos;t load your balance</p>
              <p className="mt-1 text-sm text-muted">
                It&apos;s not you — give it another try.
              </p>
              <button
                type="button"
                onClick={() => refreshBalance(ua)}
                className="btn-press mt-4 w-full rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-strong"
              >
                Try again
              </button>
            </div>
          ) : balanceUsd === 0 ? (
            <div className="rounded-3xl border border-card-border bg-card p-6 text-center">
              <PlaneMark size={40} className="mx-auto mb-2 opacity-80" />
              <p className="font-semibold">Your balance is empty</p>
              <p className="mt-1 text-sm text-muted">
                Add money once and it shows up here as one number — then tipping
                is one tap.
              </p>
              <button
                type="button"
                onClick={() => setShowTopUp((s) => !s)}
                className="btn-press mt-4 w-full rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-strong"
              >
                {showTopUp ? "Hide" : "Add money"}
              </button>
              {showTopUp && eoa && (
                <div className="mt-4 flex flex-col gap-2 text-left">
                  <p className="text-sm text-muted">
                    This is your TipJet account number. Send digital dollars
                    (USDC) to it from any exchange or wallet — on the Arbitrum
                    or Base network — and they appear here as your balance.
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-card-border bg-background p-3">
                    <code className="min-w-0 flex-1 break-all font-mono text-xs">
                      {eoa}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="shrink-0 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-strong"
                    >
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : balanceUsd !== undefined ? (
            <TipWidget
              creator={creator}
              ua={ua}
              balanceUsd={balanceUsd}
              initialAmount={initialAmount}
              onSent={handleSent}
              onBalanceRefresh={() => refreshBalance(ua)}
            />
          ) : null}

          {sent && <HowItWorked name={creator.displayName} />}
        </>
      )}

      {/* Social proof stays visible even before signing in. */}
      <SupporterWall handle={creator.handle} />

      {ua && (
        <button
          type="button"
          onClick={handleSignOut}
          className="mx-auto min-h-[44px] px-4 text-xs text-muted underline underline-offset-2 transition hover:text-foreground"
        >
          Sign out
        </button>
      )}

      {sent && toastVisible && (
        <SettledToast
          arbiscanUrl={arbiscanUrl}
          onClose={() => setToastVisible(false)}
        />
      )}
    </main>
  );
}
