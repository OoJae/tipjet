import { CHAIN_ID } from "@particle-network/universal-account-sdk";

/**
 * Native (Circle) USDC on Arbitrum One.
 * Verified against the live demo + Circle's deployment.
 */
export const ARBITRUM_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

/** Universal Account CHAIN_ID enum member for Arbitrum One (value 42161). */
export const ARBITRUM = CHAIN_ID.ARBITRUM_MAINNET_ONE;

/** Raw numeric Arbitrum One chain id (for Magic's network config). */
export const ARBITRUM_CHAIN_ID = 42161;

/** Default public Arbitrum RPC, overridable via env. */
export const ARBITRUM_RPC_URL =
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc";

/**
 * UniversalX activity page for a UA `transactionId`.
 * NOTE: `sendTransaction` returns a UA-level id, NOT an on-chain Arbitrum tx hash.
 * The Arbiscan "settled" link comes later (Stage 2/3) by watching the USDC
 * Transfer log to the receiver on Arbitrum.
 */
export const universalxActivity = (transactionId: string) =>
  `https://universalx.app/activity/details?id=${transactionId}`;
