"use client";

import { Magic } from "magic-sdk";
import { BrowserProvider, type Signer } from "ethers";
import { ARBITRUM_CHAIN_ID, ARBITRUM_RPC_URL } from "./tokens";

// Lazy singleton — constructed only in the browser, only on first use.
// (Magic touches `window` internally; never construct it at import time.)
let _magic: Magic | null = null;

export function getMagic(): Magic {
  if (typeof window === "undefined") {
    throw new Error("getMagic() called on the server — Magic is client-only.");
  }
  if (!_magic) {
    const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
    if (!key) throw new Error("Missing NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY.");
    _magic = new Magic(key, {
      network: { rpcUrl: ARBITRUM_RPC_URL, chainId: ARBITRUM_CHAIN_ID },
      // No OAuthExtension in Stage 0 — Email OTP needs nothing extra.
    });
  }
  return _magic;
}

/** Email OTP login. Returns the Magic EOA address handed to Universal Accounts. */
export async function loginEmail(email: string): Promise<string> {
  const magic = getMagic();
  await magic.auth.loginWithEmailOTP({ email });
  return getAddress();
}

/** The current Magic EOA address, read from the signer (version-proof). */
export async function getAddress(): Promise<string> {
  const signer = await getMagicSigner();
  return signer.getAddress();
}

/** Whether a Magic session is already active. */
export async function isLoggedIn(): Promise<boolean> {
  return getMagic().user.isLoggedIn();
}

/** Log out the current Magic session. */
export async function logout(): Promise<void> {
  await getMagic().user.logout();
}

/** An ethers v6 signer backed by Magic's RPC provider (signs the UA rootHash). */
export async function getMagicSigner(): Promise<Signer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new BrowserProvider(getMagic().rpcProvider as any);
  return provider.getSigner();
}
