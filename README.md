# TipJet

Tip any creator. They receive **USDC on Arbitrum** — even though the fan paid with a
different token on a different chain. No bridges, no gas tokens, no chain selector. It
feels like Venmo, not like crypto.

One stack, three prizes (UXmaxx hackathon):
- **Magic** (`magic-sdk`) — walletless login + the EIP-7702 signer.
- **Particle Universal Accounts** (`@particle-network/universal-account-sdk`, EIP-7702 mode)
  — upgrades the Magic EOA in place (same address), gives a unified balance, routes
  cross-chain liquidity automatically.
- **Arbitrum One** — the settlement chain; every tip lands as native USDC.

---

## Status: Stage 0 (smoke test)

The minimum that proves the whole chain-abstraction pipe end-to-end, before any
product UI:

**Magic email login → Universal Account (EIP-7702) → unified USD balance → one button
→ 0.1 USDC settles on Arbitrum, sourced from a token held on a different chain.**

The UI lives at `/` (`app/page.tsx` → `components/SmokeTest.tsx`): an email field, the
unified balance, one button, and a running status log.

---

## Pinned versions (do not bump toward UA V2 mid-build)

| Package | Version | Why pinned |
|---|---|---|
| `next` | `15.5.19` | latest patched 15.5.x (15.5.7 had a security advisory) |
| `react` / `react-dom` | `19.1.0` | matches the verified-working Particle 7702 demo |
| `@particle-network/universal-account-sdk` | `2.0.3` | V2 stable (npm `latest` since 2026-06-29). V1 (`1.1.1`) is being decommissioned — its cross-chain routing returns "System maintenance… withdraw" errors. |
| `magic-sdk` | `33.7.1` | exposes `wallet.sign7702Authorization` |
| `@magic-ext/oauth2` | `15.8.0` | for Google login (Stage 3) |
| `ethers` | `6.17.0` | signature serialization + rootHash signing |

---

## Setup

1. **Particle dashboard** → create a project → copy `projectId`, `clientKey`, `appId`.
   Confirm Universal Accounts / EIP-7702 is enabled. https://developers.particle.network
2. **Magic dashboard** → create an app → copy the **publishable** key (`pk_live_...`) →
   **enable Email OTP**. https://dashboard.magic.link
3. **Fund a Magic-controlled wallet** with small real funds (~$10–20) on a **supported
   source chain that is NOT Arbitrum** — e.g. **USDC or ETH on Base**. Universal Accounts
   only source liquidity from **Arbitrum, Base, Ethereum, BNB Chain, X Layer, and Solana**;
   funds on other chains (Polygon, Optimism, etc.) are safe but are **not counted** by
   `getPrimaryAssets`, even though those chains can host the 7702 upgrade. Cross-chain
   sourcing (source ≠ Arbitrum) is what the acceptance gate proves. Keep balances tiny (the
   UA V2 migration warning). The wallet address is shown on first login — fund it after that.
4. **A second wallet you control** as the test receiver.
5. Copy env and fill it in:
   ```bash
   cp .env.example .env.local   # then edit .env.local
   ```
6. Run:
   ```bash
   npm install
   npm run dev   # http://localhost:3000
   ```

> `.env.local` is gitignored. `NEXT_PUBLIC_*` vars are exposed to the browser — only
> publishable/client keys belong there.

---

## How the pipe works (Stage 0)

1. **Login** — `lib/magic.ts`: `magic.auth.loginWithEmailOTP({ email })`, then
   `magic.user.getInfo()` returns the EOA address.
2. **Universal Account** — `lib/universalAccount.ts`: `new UniversalAccount({ …,
   smartAccountOptions: { useEIP7702: true, name, version, ownerAddress }, tradeConfig:
   { slippageBps: 100 } })`. In 7702 mode the UA address equals the
   Magic EOA (asserted in the UI).
3. **Balance** — `ua.getPrimaryAssets()` → `totalAmountInUSD` rendered as one dollar figure.
4. **Send** — `lib/send.ts`: `ua.createTransferTransaction({ token: { chainId: Arbitrum,
   address: USDC }, amount, receiver })`, then handle EIP-7702 authorizations, sign the
   `rootHash`, and `ua.sendTransaction(tx, signature, authorizations)`.
5. **7702 signing** — `lib/eip7702.ts`: Magic's `sign7702Authorization` returns
   `{ v: 27|28, r, s }` (no `yParity`). We derive `yParity = v - 27`, serialize with
   `ethers.Signature.from({ r, s, yParity }).serialized`, and emit `{ userOpHash,
   signature }` per userOp. **This is the most likely point of breakage** — raw and
   serialized signatures are logged at every step.

`sendTransaction` returns a UA-level `transactionId` (not an on-chain hash); the UI links
to the UniversalX activity page. The Arbiscan "settled" proof comes in Stage 2/3 by
watching the USDC `Transfer` log to the receiver on Arbitrum.

---

## Stage 0 acceptance gate

From a fresh browser: email login → real non-zero unified balance shows → click the
button → **0.1 USDC lands at the test receiver on Arbitrum, with source funds drawn from
a different chain** (verify on the UniversalX activity page). Do not start the tip UI
until this is green.

---

## Roadmap

- **Stage 1** — public tip page `app/[handle]`, `LoginButton` / `BalancePill` / `TipWidget`.
- **Stage 2** — creator onboarding + registry, dashboard + withdraw, live `TipFeed`.
- **Stage 3** — Google login, "how it worked" reveal, "Settled on Arbitrum ✓", design pass.
- **Stage 4** — Vercel deploy, rubric-mapped writeup, demo video.

Build plan & strategy: see [`docs/`](docs/).
