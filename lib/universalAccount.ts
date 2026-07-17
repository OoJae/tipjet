"use client";

import {
  UniversalAccount,
  UNIVERSAL_ACCOUNT_VERSION,
  type IAssetsResponse,
} from "@particle-network/universal-account-sdk";

/**
 * Construct a Particle Universal Account in EIP-7702 mode for a Magic EOA.
 *
 * In 7702 mode the EOA is upgraded *in place* — the UA address equals the Magic
 * EOA address (no separate smart-account deployment). Corrections vs. the build
 * guide §8.2: `ownerAddress` lives INSIDE `smartAccountOptions` (with required
 * `name` + `version`). Gas abstraction is built into V2 (the old `universalGas`
 * tradeConfig flag no longer exists).
 */
export function makeUniversalAccount(ownerEoaAddress: string): UniversalAccount {
  if (typeof window === "undefined") {
    throw new Error("makeUniversalAccount() called on the server.");
  }
  const projectId = process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID;
  const projectClientKey = process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY;
  const projectAppUuid = process.env.NEXT_PUBLIC_PARTICLE_APP_ID;
  if (!projectId || !projectClientKey || !projectAppUuid) {
    throw new Error("Missing one or more NEXT_PUBLIC_PARTICLE_* env vars.");
  }

  return new UniversalAccount({
    projectId,
    projectClientKey,
    projectAppUuid,
    smartAccountOptions: {
      useEIP7702: true, // upgrade the EOA in place (same address)
      name: "UNIVERSAL",
      version: UNIVERSAL_ACCOUNT_VERSION,
      ownerAddress: ownerEoaAddress,
    },
    tradeConfig: {
      slippageBps: 100, // 1%
    },
  });
}

export interface UnifiedBalance {
  totalUsd: number;
  assets: IAssetsResponse["assets"];
}

/** Fetch the unified cross-chain balance (single USD figure + per-token breakdown). */
export async function getUnifiedBalance(
  ua: UniversalAccount,
): Promise<UnifiedBalance> {
  const res = await ua.getPrimaryAssets();
  return { totalUsd: res.totalAmountInUSD, assets: res.assets };
}

/**
 * The UA's reported address. In 7702 mode this MUST equal the Magic EOA —
 * use it to assert the "same address, upgraded in place" invariant.
 */
export async function getUaAddress(
  ua: UniversalAccount,
): Promise<string | undefined> {
  const opts = await ua.getSmartAccountOptions();
  return opts.smartAccountAddress ?? opts.ownerAddress;
}
