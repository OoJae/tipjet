"use client";

import { useEffect, useState } from "react";
import {
  Contract,
  EventLog,
  JsonRpcProvider,
  formatUnits,
  type Log,
} from "ethers";
import { ARBITRUM_RPC_URL, ARBITRUM_USDC } from "@/lib/tokens";

const TRANSFER_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];
// Arbitrum One produces ~4 blocks/second, so 250k blocks ≈ the last ~17 hours.
const BACKFILL_BLOCKS = 250_000;
const MIN_RANGE = 10_000; // floor for split-on-error when an RPC caps getLogs ranges

function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Subtle progress bar toward a creator's tip goal, summed from USDC received
 * on Arbitrum over the backfill window. One query on mount — no polling.
 */
export default function GoalBar({
  goalUsd,
  goalLabel,
  receivingAddress,
}: {
  goalUsd: number;
  goalLabel?: string;
  receivingAddress: string;
}) {
  // undefined = still summing
  const [raisedUsd, setRaisedUsd] = useState<number>();

  useEffect(() => {
    if (!receivingAddress) return;

    let cancelled = false;
    const provider = new JsonRpcProvider(ARBITRUM_RPC_URL);
    const usdc = new Contract(ARBITRUM_USDC, TRANSFER_ABI, provider);
    const filter = usdc.filters.Transfer(null, receivingAddress);

    // queryFilter with recursive halving: some public RPCs cap getLogs ranges.
    const queryRange = async (
      from: number,
      to: number,
    ): Promise<(EventLog | Log)[]> => {
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

    (async () => {
      try {
        const latest = await provider.getBlockNumber();
        const logs = await queryRange(
          Math.max(latest - BACKFILL_BLOCKS, 0),
          latest,
        );
        let total = BigInt(0);
        for (const log of logs) {
          if (log instanceof EventLog) total += log.args.value as bigint;
        }
        if (!cancelled) setRaisedUsd(Number(formatUnits(total, 6)));
      } catch {
        // couldn't read — show an unfilled bar rather than pulse forever
        if (!cancelled) setRaisedUsd(0);
      }
    })();

    return () => {
      cancelled = true;
      provider.destroy();
    };
  }, [receivingAddress]);

  const label = goalLabel?.trim() ? goalLabel : "Tip goal";
  const loading = raisedUsd === undefined;
  const pct =
    loading || goalUsd <= 0 ? 0 : Math.min((raisedUsd / goalUsd) * 100, 100);

  return (
    <section aria-label="Tip goal progress" className="flex flex-col gap-1.5">
      <p className="text-sm">
        <span className="font-medium">{label}</span>
        {!loading && (
          <span className="text-muted">
            {" — "}
            <span className="font-semibold tabular-nums text-money">
              ${fmtUsd(raisedUsd)}
            </span>{" "}
            of <span className="tabular-nums">${fmtUsd(goalUsd)}</span>
          </span>
        )}
      </p>
      <div
        className={`h-3 w-full overflow-hidden rounded-full border border-card-border bg-background ${
          loading ? "animate-pulse" : ""
        }`}
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </section>
  );
}
