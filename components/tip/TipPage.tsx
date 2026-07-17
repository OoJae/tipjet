"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { fetchCreator, normalizeHandle, type Creator } from "@/lib/creators";
import { isLoggedIn, getAddress, logout } from "@/lib/magic";
import { makeUniversalAccount, getUnifiedBalance } from "@/lib/universalAccount";
import LoginButton from "@/components/tip/LoginButton";
import BalancePill from "@/components/tip/BalancePill";
import TipWidget from "@/components/tip/TipWidget";
import SettledToast from "@/components/tip/SettledToast";
import HowItWorked from "@/components/tip/HowItWorked";
import { fireConfetti } from "@/components/tip/confetti";

type SentResult = { transactionId: string; activityUrl: string };

export default function TipPage({ handle }: { handle: string }) {
  // undefined = loading, null = not found
  const [creator, setCreator] = useState<Creator | null | undefined>(undefined);
  const [ua, setUa] = useState<UniversalAccount>();
  const [balanceUsd, setBalanceUsd] = useState<number>();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sent, setSent] = useState<SentResult>();
  const [toastVisible, setToastVisible] = useState(false);

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
    } catch {
      // keep the previous number; the ↻ button lets the fan retry
    }
  }, []);

  const initAccount = useCallback(
    async (eoa: string) => {
      const account = makeUniversalAccount(eoa);
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
    fireConfetti();
  }

  async function handleSignOut() {
    try {
      await logout();
    } catch {
      // ignore — clear local state regardless
    }
    setUa(undefined);
    setBalanceUsd(undefined);
    setSent(undefined);
    setToastVisible(false);
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
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-strong text-3xl font-bold text-white">
          ?
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          This TipJet doesn&apos;t exist yet
        </h1>
        <p className="text-muted">
          The link may be mistyped — or the person you&apos;re looking for
          hasn&apos;t claimed it.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-strong"
        >
          Take me home
        </Link>
      </main>
    );
  }

  // ── The tip page ───────────────────────────────────────────────────────
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-strong text-3xl font-bold text-white">
          {creator.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm text-muted">@{creator.handle}</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {creator.displayName}
          </h1>
        </div>
        <p className="text-muted">Leave {creator.displayName} a tip 💜</p>
      </header>

      {bootstrapping && !ua ? (
        <div className="animate-pulse rounded-3xl border border-card-border bg-card p-6 text-center text-muted">
          One moment…
        </div>
      ) : !ua ? (
        <LoginButton onLoggedIn={initAccount} />
      ) : (
        <>
          <BalancePill usd={balanceUsd} onRefresh={() => refreshBalance(ua)} />

          {balanceUsd === 0 ? (
            <div className="rounded-3xl border border-card-border bg-card p-6 text-center">
              <p className="font-semibold">Your balance is empty</p>
              <p className="mt-1 text-sm text-muted">
                Add money from any account you already have — it shows up here
                as one number.
              </p>
            </div>
          ) : balanceUsd !== undefined ? (
            <TipWidget
              creator={creator}
              ua={ua}
              balanceUsd={balanceUsd}
              onSent={handleSent}
              onBalanceRefresh={() => refreshBalance(ua)}
            />
          ) : null}

          {sent && <HowItWorked name={creator.displayName} />}

          <button
            type="button"
            onClick={handleSignOut}
            className="mx-auto min-h-[44px] px-4 text-xs text-muted underline underline-offset-2 transition hover:text-foreground"
          >
            Sign out
          </button>
        </>
      )}

      {sent && toastVisible && (
        <SettledToast
          activityUrl={sent.activityUrl}
          onClose={() => setToastVisible(false)}
        />
      )}
    </main>
  );
}
