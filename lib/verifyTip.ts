// Server-only: confirm a tip actually settled on-chain before it can credit a
// creator's public "raised" total or appear on the supporter wall.
import { JsonRpcProvider } from "ethers";

const ARBITRUM_USDC = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const RPC =
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc";
// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/**
 * Verify `txHash` is a confirmed Arbitrum transaction containing a USDC
 * `Transfer` to `receiver`. Returns the total USDC received in that tx (human
 * units, 6dp), or null if the tx is missing/failed/has no matching transfer.
 */
export async function verifyUsdcTipReceived(
  txHash: string,
  receiver: string,
): Promise<number | null> {
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) return null;
  if (!/^0x[0-9a-fA-F]{40}$/.test(receiver)) return null;

  const provider = new JsonRpcProvider(RPC);
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) return null;

    const recv = receiver.toLowerCase();
    let total = BigInt(0);
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== ARBITRUM_USDC) continue;
      if (log.topics[0] !== TRANSFER_TOPIC || log.topics.length < 3) continue;
      // topics[2] is the 32-byte padded `to` address.
      const to = "0x" + log.topics[2].slice(26).toLowerCase();
      if (to !== recv) continue;
      total += BigInt(log.data);
    }
    if (total === BigInt(0)) return null;
    return Number(total) / 1e6;
  } catch {
    return null;
  } finally {
    provider.destroy();
  }
}
