"use client";

import { getBytes } from "ethers";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { getMagicSigner } from "./magic";
import { handleMagicEIP7702Authorizations } from "./eip7702";
import { ARBITRUM, ARBITRUM_USDC, universalxActivity } from "./tokens";

export interface SendResult {
  transactionId: string;
  activityUrl: string;
}

/**
 * Build → authorize → sign → send a tiny USDC transfer that SETTLES ON ARBITRUM.
 *
 * Universal Liquidity automatically sources the funds from whatever chain/token
 * the user holds — the caller never picks a source chain or a gas token. This is
 * the whole TipJet pipe in one function.
 *
 * @param amount  human-readable token amount as a string, e.g. "0.1" USDC.
 */
export async function sendUsdcOnArbitrum(
  ua: UniversalAccount,
  receiver: string,
  amount: string,
  log: (msg: string) => void = () => {},
): Promise<SendResult> {
  // 1) Build the cross-chain transfer. Destination = Circle USDC on Arbitrum.
  log(`Building transfer of ${amount} USDC → Arbitrum…`);
  const transaction = await ua.createTransferTransaction({
    token: { chainId: ARBITRUM, address: ARBITRUM_USDC },
    amount,
    receiver,
  });
  console.log("[send] built transaction", {
    rootHash: transaction.rootHash,
    userOps: transaction.userOps?.length,
    tokenChanges: transaction.tokenChanges,
  });
  log(`Routing across ${transaction.userOps?.length ?? 0} operation(s).`);

  // 2) EIP-7702 authorizations (first tx upgrades the EOA; later txs return []).
  const authorizations = await handleMagicEIP7702Authorizations(transaction.userOps);
  log(`Prepared ${authorizations.length} EIP-7702 authorization(s).`);

  // 3) Sign the rootHash with the Magic ethers signer (EIP-191 personal_sign).
  log("Signing the transaction…");
  const signer = await getMagicSigner();
  const signature = await signer.signMessage(getBytes(transaction.rootHash));

  // 4) Broadcast. The SDK injects the signature + authorizations and routes liquidity.
  log("Settling on Arbitrum…");
  const result = await ua.sendTransaction(transaction, signature, authorizations);
  console.log("[send] sendTransaction result", result);

  const transactionId: string = result?.transactionId ?? "(submitted)";
  return { transactionId, activityUrl: universalxActivity(transactionId) };
}
