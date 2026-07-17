"use client";

import { useEffect, useState } from "react";
import { Contract, EventLog, JsonRpcProvider, formatUnits } from "ethers";
import { ARBITRUM_RPC_URL, ARBITRUM_USDC } from "@/lib/tokens";

const TRANSFER_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];
// Arbitrum One produces ~4 blocks/second, so 250k blocks ≈ the last ~17 hours.
// (2000 blocks would be ~8 minutes — an empty-looking feed.)
const BACKFILL_BLOCKS = 250_000;
const MIN_RANGE = 10_000; // floor for split-on-error when an RPC caps getLogs ranges
const POLL_MS = 5000;
const MAX_TIPS = 50;

interface Tip {
  id: string; // txHash:logIndex
  txHash: string;
  from: string;
  usd: string;
  isNew: boolean; // seen live (vs. initial backfill)
}

function shortAddress(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function formatUsd(value: bigint): string {
  return Number(formatUnits(value, 6)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Live feed of incoming USDC transfers to `address` on Arbitrum (5s polling). */
export default function TipFeed({ address }: { address: string }) {
  const [tips, setTips] = useState<Tip[]>([]);

  useEffect(() => {
    if (!address) return;

    let cancelled = false;
    let busy = false; // guard against overlapping polls
    let initialized = false; // backfill window queried once
    let lastBlock = 0;
    const seen = new Set<string>();

    const provider = new JsonRpcProvider(ARBITRUM_RPC_URL);
    const usdc = new Contract(ARBITRUM_USDC, TRANSFER_ABI, provider);
    const filter = usdc.filters.Transfer(null, address);

    // queryFilter with recursive halving: some public RPCs cap getLogs ranges.
    const queryRange = async (
      from: number,
      to: number,
    ): Promise<(EventLog | import("ethers").Log)[]> => {
      try {
        return await usdc.queryFilter(filter, from, to);
      } catch (err) {
        if (to - from <= MIN_RANGE) throw err;
        const mid = Math.floor((from + to) / 2);
        const [a, b] = await Promise.all([
          queryRange(from, mid),
          queryRange(mid + 1, to),
        ]);
        return [...a, ...b];
      }
    };

    const poll = async () => {
      if (busy || cancelled) return;
      busy = true;
      try {
        const latest = await provider.getBlockNumber();
        const fromBlock = initialized
          ? lastBlock + 1
          : Math.max(latest - BACKFILL_BLOCKS, 0);
        if (fromBlock <= latest) {
          const logs = await queryRange(fromBlock, latest);
          const fresh: Tip[] = [];
          for (const log of logs) {
            if (!(log instanceof EventLog)) continue;
            const id = `${log.transactionHash}:${log.index}`;
            if (seen.has(id)) continue;
            seen.add(id);
            fresh.push({
              id,
              txHash: log.transactionHash,
              from: shortAddress(log.args.from as string),
              usd: formatUsd(log.args.value as bigint),
              isNew: initialized,
            });
          }
          if (fresh.length > 0 && !cancelled) {
            fresh.reverse(); // newest first
            setTips((prev) => [...fresh, ...prev].slice(0, MAX_TIPS));
          }
          lastBlock = latest;
          initialized = true;
        }
      } catch {
        /* transient RPC hiccup — retry on the next tick */
      } finally {
        busy = false;
      }
    };

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
      provider.destroy();
    };
  }, [address]);

  return (
    <section className="rounded-2xl border border-card-border bg-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        Recent tips
      </h2>
      {tips.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Tips will appear here the moment they arrive.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-card-border">
          {tips.map((tip) => (
            <li
              key={tip.id}
              className={`flex items-center justify-between gap-3 py-3 ${
                tip.isNew ? "animate-pop" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="font-semibold tabular-nums text-money">
                  +${tip.usd}
                </p>
                <p className="truncate font-mono text-xs text-muted">
                  from {tip.from}
                  {tip.isNew ? " · just now" : ""}
                </p>
              </div>
              <a
                href={`https://arbiscan.io/tx/${tip.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-brand hover:underline"
              >
                Arbiscan ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
