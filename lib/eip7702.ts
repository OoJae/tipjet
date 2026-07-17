"use client";

import { Signature } from "ethers";
import type {
  IUserOpWithChain,
  EIP7702Authorization,
} from "@particle-network/universal-account-sdk";
import { getMagic } from "./magic";

/**
 * Magic-flavored port of the Particle demo's `handleEIP7702Authorizations`.
 *
 * The official demo uses Privy's signer, which returns `{ r, s, v?, yParity }`.
 * Magic is different: `magic.wallet.sign7702Authorization(...)` returns
 * `{ contractAddress, chainId, nonce, v, r, s }` with NO `yParity`, where `v` is
 * the recovery id (27|28). We derive `yParity`, serialize with ethers, and emit
 * one `{ userOpHash, signature }` per userOp that needs the upgrade — the exact
 * `EIP7702Authorization` shape `sendTransaction` consumes.
 *
 * The FIRST transaction per chain produces authorizations; once the EOA is
 * delegated (`eip7702Delegated === true`), later transactions yield an empty
 * array automatically — no call-site branching needed.
 *
 * This is the single most likely point of breakage, so every signature is logged
 * raw + serialized.
 */
export async function handleMagicEIP7702Authorizations(
  userOps: IUserOpWithChain[],
): Promise<EIP7702Authorization[]> {
  const magic = getMagic();
  const authorizations: EIP7702Authorization[] = [];
  // Identical auth tuples (same delegate impl + chain + nonce) need signing once.
  // Key by the FULL tuple: a fresh EOA has nonce 0 on every chain, so a
  // nonce-only key would reuse a signature signed for the wrong chainId.
  const byTuple = new Map<string, string>();

  for (const userOp of userOps) {
    const auth = userOp.eip7702Auth;
    if (!auth || userOp.eip7702Delegated) continue;

    const tupleKey = `${Number(auth.chainId)}:${auth.address.toLowerCase()}:${auth.nonce}`;
    let serialized = byTuple.get(tupleKey);
    if (!serialized) {
      // Magic signs the EIP-7702 authorization tuple.
      const sig = await magic.wallet.sign7702Authorization({
        contractAddress: auth.address,
        chainId: Number(auth.chainId),
        nonce: auth.nonce,
      });

      // Magic returns `v` as a recovery id (27|28). Derive yParity (0|1).
      const vNum = Number(sig.v);
      const yParity = vNum >= 27 ? vNum - 27 : vNum;
      if (yParity !== 0 && yParity !== 1) {
        throw new Error(`Unexpected Magic 7702 v=${vNum} (expected 0/1 or 27/28).`);
      }

      // Serialize via the canonical { r, s, v } form (v = yParity + 27 → 27|28).
      serialized = Signature.from({
        r: sig.r,
        s: sig.s,
        v: yParity + 27,
      }).serialized;

      console.log("[7702] signed authorization", {
        contractAddress: auth.address,
        chainId: Number(auth.chainId),
        nonce: auth.nonce,
        rawV: vNum,
        yParity,
        serialized,
      });

      byTuple.set(tupleKey, serialized);
    }

    authorizations.push({ userOpHash: userOp.userOpHash, signature: serialized });
  }

  return authorizations;
}
