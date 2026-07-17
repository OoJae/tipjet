// Probes whether Particle's cross-chain routing is back after the V1→V2 cutover.
// Builds (does NOT send) a 0.5 USDC Base→Arbitrum transfer. Exit 0 = routing is UP.
// Run: node scripts/probe-crosschain.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  UniversalAccount,
  UNIVERSAL_ACCOUNT_VERSION,
  CHAIN_ID,
} from "@particle-network/universal-account-sdk";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const OWNER = "0x67658f64645D034F67f8d6847c48983215C05378";
const USDC_ARB = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

const ua = new UniversalAccount({
  projectId: env.NEXT_PUBLIC_PARTICLE_PROJECT_ID,
  projectClientKey: env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY,
  projectAppUuid: env.NEXT_PUBLIC_PARTICLE_APP_ID,
  smartAccountOptions: {
    useEIP7702: true,
    name: "UNIVERSAL",
    version: UNIVERSAL_ACCOUNT_VERSION,
    ownerAddress: OWNER,
  },
  tradeConfig: { slippageBps: 100 },
});

try {
  const tx = await ua.createTransferTransaction({
    token: { chainId: CHAIN_ID.ARBITRUM_MAINNET_ONE, address: USDC_ARB },
    amount: "0.5",
    receiver: env.NEXT_PUBLIC_TEST_RECEIVER,
  });
  console.log(
    `UP ✓ cross-chain build succeeded (userOps=${tx.userOps?.length}, rootHash=${tx.rootHash?.slice(0, 12)}…)`,
  );
  process.exit(0);
} catch (e) {
  console.log(`DOWN — ${e?.code ?? ""} ${e?.message ?? e}`);
  process.exit(1);
}
