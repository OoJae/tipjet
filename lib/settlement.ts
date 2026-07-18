"use client";

import { Contract, EventLog, JsonRpcProvider } from "ethers";
import { ARBITRUM_RPC_URL, ARBITRUM_USDC } from "./tokens";

const TRANSFER_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

/**
 * Watch Arbitrum for the USDC Transfer that settles a just-sent tip, so the UI
 * can show a real, verifiable Arbiscan link instead of a submission receipt.
 *
 * Polls every 4s (public RPC friendly) for up to `timeoutMs`; matches the first
 * transfer to `receiver` whose amount is within 2% (routing can add dust).
 * Scans FORWARD only from ~`sinceBlock` (captured near send time) so it can
 * never latch onto an unrelated earlier tip to the same creator.
 * Returns a stop() function; always cleans up its provider.
 */
export function watchForSettlement(opts: {
  receiver: string;
  amountUsdc: number;
  onSettled: (txHash: string) => void;
  /** Chain head captured at send time; the scan floor. */
  sinceBlock?: number;
  timeoutMs?: number;
}): () => void {
  const { receiver, amountUsdc, onSettled, sinceBlock, timeoutMs = 150_000 } = opts;
  const provider = new JsonRpcProvider(ARBITRUM_RPC_URL);
  const usdc = new Contract(ARBITRUM_USDC, TRANSFER_ABI, provider);
  const filter = usdc.filters.Transfer(null, receiver);
  const startedAt = Date.now();
  let stopped = false;
  let startBlock = 0;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    provider.destroy();
  };

  const tick = async () => {
    if (stopped) return;
    try {
      const latest = await provider.getBlockNumber();
      if (!startBlock) {
        // Floor at send time when known; otherwise a tight ~6s margin
        // (Arbitrum ~4 blocks/s) — never the old ~100s window.
        startBlock = sinceBlock ?? Math.max(latest - 25, 0);
      }
      const logs = await usdc.queryFilter(filter, startBlock, latest);
      for (const log of logs) {
        if (!(log instanceof EventLog)) continue;
        const value = Number(log.args.value) / 1e6;
        const tolerance = Math.max(amountUsdc * 0.02, 0.01);
        if (Math.abs(value - amountUsdc) <= tolerance) {
          const txHash = log.transactionHash;
          stop();
          onSettled(txHash);
          return;
        }
      }
      startBlock = latest + 1;
    } catch {
      /* transient RPC hiccup — retry next tick */
    }
    if (Date.now() - startedAt > timeoutMs) stop();
  };

  const timer = setInterval(tick, 4000);
  void tick();
  return stop;
}
