"use client";

import { useEffect, useState } from "react";
import { isAddress } from "ethers";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { loginEmail, isLoggedIn, logout, getAddress } from "@/lib/magic";
import {
  makeUniversalAccount,
  getUnifiedBalance,
  getUaAddress,
} from "@/lib/universalAccount";
import { sendUsdcOnArbitrum } from "@/lib/send";

// Chains whose balances Universal Accounts actually SOURCE liquidity from.
// (Distinct from the 8 chains that support the 7702 upgrade — Polygon can host
// the account but its balances are NOT counted by getPrimaryAssets.)
const SUPPORTED_SOURCE = "Arbitrum, Base, Ethereum, BNB Chain, X Layer, or Solana";

type LogLine = { t: string; msg: string };

export default function SmokeTest() {
  const [email, setEmail] = useState("");
  const [eoa, setEoa] = useState<string>();
  const [ua, setUa] = useState<UniversalAccount>();
  const [usd, setUsd] = useState<number>();
  const [log, setLog] = useState<LogLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState<{ id: string; url: string }>();

  const push = (msg: string) => {
    const t = new Date().toLocaleTimeString();
    setLog((l) => [...l, { t, msg }]);
  };

  // Bootstrap a UA if a Magic session already exists (session persists across reloads).
  useEffect(() => {
    (async () => {
      try {
        if (await isLoggedIn()) {
          const address = await getAddress();
          push(`Existing Magic session: ${address}`);
          await initAccount(address);
        }
      } catch (e) {
        console.warn("session bootstrap skipped", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initAccount(address: string) {
    setEoa(address);
    const account = makeUniversalAccount(address);
    setUa(account);
    push("Universal Account constructed (EIP-7702 mode).");

    const uaAddr = await getUaAddress(account);
    push(`UA address: ${uaAddr ?? "(unknown)"}`);
    if (uaAddr && uaAddr.toLowerCase() !== address.toLowerCase()) {
      push("⚠️ UA address ≠ Magic EOA — 7702 in-place upgrade not confirmed.");
    } else {
      push("✓ UA address == Magic EOA (upgraded in place).");
    }

    await reportBalance(account);
  }

  async function reportBalance(account: UniversalAccount) {
    const { totalUsd, assets } = await getUnifiedBalance(account);
    setUsd(totalUsd);
    push(`Unified balance: $${totalUsd.toFixed(2)} across ${assets.length} token(s).`);
    assets.forEach((a) =>
      push(`  • ${String(a.tokenType).toUpperCase()}: ${a.amount} ($${a.amountInUSD.toFixed(2)})`),
    );
    if (totalUsd === 0) {
      push(`Balance is $0 — Universal Accounts only source from ${SUPPORTED_SOURCE}.`);
      push("Funds on unsupported chains (e.g. Polygon) are safe but won't be counted.");
    }
  }

  async function handleLogin() {
    setBusy(true);
    try {
      push("Logging in via Magic Email OTP…");
      const address = await loginEmail(email);
      push(`Magic EOA: ${address}`);
      await initAccount(address);
    } catch (e) {
      push(`LOGIN ERROR: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    if (!ua || !eoa) return;
    setBusy(true);
    setLastTx(undefined);
    try {
      // Self-send: the smoke test routes 0.1 USDC to the logged-in visitor's
      // OWN account, so a stranger poking /dev can never fund someone else.
      const receiver = eoa;
      if (!receiver || !isAddress(receiver)) {
        throw new Error("No account address — log in first.");
      }
      if (!usd || usd <= 0) {
        throw new Error(
          `Balance is $0.00 — fund a supported source chain (${SUPPORTED_SOURCE}), e.g. USDC on Base, then refresh.`,
        );
      }
      const { transactionId, activityUrl } = await sendUsdcOnArbitrum(ua, receiver, "0.1", push);
      push(`DONE ✓  UA transactionId: ${transactionId}`);
      setLastTx({ id: transactionId, url: activityUrl });
      // refresh balance after settling
      const { totalUsd } = await getUnifiedBalance(ua);
      setUsd(totalUsd);
    } catch (e) {
      push(`SEND ERROR: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh() {
    if (!ua) return;
    setBusy(true);
    try {
      push("Refreshing balance…");
      await reportBalance(ua);
    } catch (e) {
      push(`REFRESH ERROR: ${errMsg(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await logout();
    } catch {
      /* ignore */
    }
    setEoa(undefined);
    setUa(undefined);
    setUsd(undefined);
    setLastTx(undefined);
    setLog([]);
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">TipJet — Stage 0</h1>
        <p className="text-sm text-neutral-500">
          Smoke test: Magic login → Universal Account (EIP-7702) → unified balance →
          one cross-chain USDC transfer settling on Arbitrum.
        </p>
      </header>

      {!eoa ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-5">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button
            disabled={busy || !email}
            onClick={handleLogin}
            className="rounded-lg bg-violet-600 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            {busy ? "Working…" : "Log in (Email OTP)"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-neutral-500" title={eoa}>
              {eoa}
            </span>
            <button
              onClick={handleLogout}
              disabled={busy}
              className="shrink-0 text-xs text-neutral-500 underline disabled:opacity-40"
            >
              log out
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold">
              {usd === undefined ? "…" : `$${usd.toFixed(2)}`}
            </div>
            <button
              onClick={handleRefresh}
              disabled={busy}
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-500 disabled:opacity-40"
            >
              ↻ refresh
            </button>
          </div>
          <button
            disabled={busy}
            onClick={handleSend}
            className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
          >
            {busy ? "Working…" : "Send 0.1 USDC → Arbitrum"}
          </button>
          {lastTx && (
            <a
              href={lastTx.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-violet-600 underline"
            >
              View activity ↗
            </a>
          )}
        </div>
      )}

      <pre className="min-h-32 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-neutral-950 p-4 text-xs leading-relaxed text-emerald-400">
        {log.length === 0
          ? "status log will appear here…"
          : log.map((l) => `${l.t}  ${l.msg}`).join("\n")}
      </pre>
    </main>
  );
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
