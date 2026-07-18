# TipJet

**Tip any creator in two taps — pay with whatever you hold, on whatever chain, and they receive clean USDC on Arbitrum.** No wallet installs, no seed phrases, no gas tokens, no bridges, no chain selectors: a fan types their email, taps **Tip $5**, and it feels like Venmo.

Built solo for the **Encode UXmaxx hackathon** — one stack, three prizes:

- **Particle Universal Accounts** (V2, EIP-7702 mode) — the chain abstraction layer.
- **Arbitrum One** — the settlement chain; every tip lands as native USDC.
- **Magic** — walletless email login *and* the EIP-7702 signer.

---

## What happens when you tip (the 60-second version)

1. **Open a creator's page** (`/alex`). Big friendly amounts, no signup wall, no jargon.
2. **Type your email.** Magic sends a 6-digit code. Behind that code an Ethereum account already exists — no extension, no seed phrase, no app store detour.
3. **That same address becomes a Universal Account.** Particle's V2 SDK upgrades the Magic EOA **in place** via EIP-7702 — same address before and after. The `/dev` smoke test asserts and logs the `UA address == Magic EOA` invariant on-screen so it's verifiable.
4. **You see one balance.** `getPrimaryAssets()` sums everything you hold across the supported source chains (Arbitrum, Base, Ethereum, BNB Chain, X Layer, Solana) into a single dollar figure. Not "0.004 ETH on Base + 12 USDC on Arbitrum" — just **$23.40**.
5. **Tap "Tip $5".** The SDK builds a transfer whose *destination* is native USDC on Arbitrum One. Universal Liquidity picks the *source* chain and token automatically — the fan never chooses.
6. **Signing is invisible.** Magic signs (a) the EIP-7702 authorization tuple — first transaction only — and (b) the transaction `rootHash`. The fan sees a spinner, then a success pop.
7. **Settled on Arbitrum ✓.** The creator's dashboard tip feed updates live. That line is the only chain mention in the entire fan experience — a deliberate trust moment, not a configuration step.

Around that core flow:

- **Tip notes + supporter wall.** A fan can sign their tip with a name and a short note ("your videos got me through finals ❤️"); the creator's page shows a wall of recent supporters, so a tip page never looks empty and every tip reads like a message, not a payment. **Every note is on-chain-verified**: the server confirms the submitted Arbitrum tx hash is a real USDC transfer to the creator (of at least the claimed amount, each hash counted once) before the note posts or the goal bar's "raised" total moves — so the wall and the goal can't be forged, and the amount always comes from the chain, never the caller. **Claiming and goal changes are wallet-gated too**: both are EIP-191 signed by the creator's Magic wallet and verified server-side against the payout address (you can't claim a handle that pays out to a wallet you don't control). *Out of scope for the hackathon: name-level impersonation (e.g. claiming a celebrity's handle) — that's a KYC/reserved-names problem, not a crypto one.*
- **Goal bar.** Creators can set a labelled goal ("New mic fund") and the page shows a progress bar that ticks up as tips land — a reason to tip *now*.
- **QR + request links.** Every creator gets a scannable QR code for their page (`/api/qr`) — printable for a stream overlay, a bio, or a merch table — plus shareable request links.
- **OG previews.** Dropping a tip link into a chat or timeline unfurls into a proper share card ("Tip Alex · @alex · TipJet"), so the link sells itself before anyone clicks.
- **Receipt card.** After settlement the fan sees exactly what happened in one line: *"You paid from Base → Alex received dollars on Arbitrum · same account, no bridge."*

---

## Architecture

```
  fan's email
      │
      ▼
┌─────────────────────────────┐
│  Magic (email OTP)          │   magic-sdk 33.7.1
│  EOA = the only signer      │   no extension · no seed phrase
└──────────────┬──────────────┘
               │  same address ↓ (EIP-7702: upgraded IN PLACE)
┌──────────────▼──────────────┐
│  Particle Universal Account │   universal-account-sdk 2.0.3 (V2)
│  UA address == Magic EOA    │   one unified USD balance
└──────────────┬──────────────┘
               │  Universal Liquidity routes automatically
               │  (source: whatever chain the fan holds funds on —
               │   Arbitrum · Base · Ethereum · BNB · X Layer · Solana)
               ▼
┌─────────────────────────────┐
│  USDC on Arbitrum One       │   native (Circle) USDC
│  0xaf88…5831 → creator      │   "Settled on Arbitrum ✓"
└─────────────────────────────┘
```

The interesting engineering lives in `lib/eip7702.ts`. Particle's official 7702 demo uses Privy as the signer; Magic's `wallet.sign7702Authorization` returns a different shape — `{ v: 27|28, r, s }` with no `yParity`. We derive `yParity = v − 27`, serialize with ethers' `Signature`, and pass `[{ userOpHash, signature }]` into `ua.sendTransaction`. This Magic-flavored port was written against the live SDK and proven working — as far as we know, TipJet is the first Magic × Particle-7702 pairing.

---

## Rubric mapping

### Particle Universal Accounts Track (UX 40 · Innovative UA+7702 30 · Adoption 20 · Polish 10)

- **UX (40):** Email → tip in two taps. One aggregated dollar balance replaces per-chain token lists. Zero chain selectors, gas prompts, bridge UIs or crypto vocabulary anywhere in the fan flow — money is "$5.00". SDK errors are mapped to plain-language messages; a raw error string never reaches a fan.
- **Innovative use of UA + 7702 (30):** The Magic EOA is upgraded **in place** via EIP-7702 — the UA address *equals* the login address (verifiable on the `/dev` smoke test, which asserts and logs the invariant). Magic as the 7702 signer is a non-obvious pairing (Particle's own demo uses Privy); the authorization flow was ported to Magic's `{v, r, s}` signature shape in `lib/eip7702.ts`. Both sides of the marketplace are Universal Accounts: a creator's receiving address is the same Magic address they logged in with.
- **Adoption (20):** Creator tipping is a real consumer market with an obvious wedge: fans hold assets scattered across chains; creators want one spendable currency. Handle claiming takes under a minute (`/claim`), the registry runs on Upstash Redis (production-shaped, in-memory fallback for dev), and the payout — native USDC on Arbitrum — is immediately spendable.

  **The numbers behind the wedge.** The incumbents price the case for us. On take rates: TikTok keeps roughly half the value of a gift by the time it reaches the creator; Twitch Bits carry a ~23–40% markup on the buy side before Twitch's own split; YouTube takes 30% of every Super Chat; Patreon lands around 12–15% all-in once payment processing is counted; even "cheap" Buy Me a Coffee runs 8%+ with processor fees. TipJet's platform fee is 0% — the tip is the payout. On chargebacks: donations generally aren't covered by PayPal's seller protection, and a disputed tip typically costs a streamer a ~$20 dispute fee *on top of* the clawed-back money — a whole genre of "donation griefing" that is impossible on TipJet by construction, because settled USDC cannot be reversed. On geography: Stripe-dependent tipping platforms simply exclude creators in unsupported countries — Nigeria and India among them — no matter how large their audience; TipJet needs only an email address.
- **Polish (10):** Mobile-first (designed at 375 px), Tailwind v4 design tokens, animated success moment, loading/empty/error states throughout, and a `/dev` smoke-test page kept in the build so judges can watch the raw pipeline log itself.

### Arbitrum "Road to Open House London" (UX 30 · Creativity 30 · Adoption 20 · Execution 20)

- **UX (30):** TipJet reads like a normal consumer product — Venmo, not a dApp. The *single* chain mention in the fan flow is "Settled on Arbitrum ✓": Arbitrum appears as the trust anchor, not as a dropdown option.
- **Creativity (30):** A fresh framing of the chain: **pay with anything, receive one clean currency on Arbitrum.** Arbitrum is the settlement and receiving layer for consumer money — every tip, from any source chain, converges there.
- **Adoption (20):** Every tip lands as native (Circle) USDC at `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` on Arbitrum One — spendable, off-rampable, composable. Creator withdrawals default to Arbitrum. One-line pitch: *TipJet is the tip jar that turns whatever fans hold into USDC on Arbitrum.*
- **Execution (20):** Pinned dependency versions, TypeScript strict, a typed `lib/` layer with a proven live pipeline, honest status reporting (below), and a preserved Stage-0 smoke test for verification.

### Magic Labs bonus (onboarding · creative use · polish · consumer-ready · technical quality)

- **Smooth onboarding:** Email OTP is the entire signup. By the time the code screen closes, the fan has a funded-able Ethereum account — the first 30 seconds contain zero crypto concepts.
- **Creative use:** The Magic wallet **doubles as the EIP-7702 signer** feeding Particle's Universal Account — `sign7702Authorization` authorizes the in-place account upgrade, and the same Magic-backed ethers signer signs every transaction `rootHash`. Magic isn't just login here; it is the cryptographic root of the whole chain-abstraction stack.
- **Polish / consumer-ready:** No wallet, gas, chain, or signing vocabulary on any fan-facing surface; mobile-first layouts; friendly failure copy.
- **Technical quality:** `lib/magic.ts` is a lazy, browser-only singleton (Magic touches `window`, so it is never constructed at import time); the address is read through the ethers signer (version-proof); the `v → yParity` derivation in `lib/eip7702.ts` is guarded, documented, and logged raw + serialized at every step.

---

## Status: verified live, end to end — with on-chain proof

**The full pipeline is proven in production** (July 17, 2026): Magic email login → Universal Account in EIP-7702 mode (same-address invariant asserted + logged on the `/dev` smoke test) → real unified balance aggregated across chains → tip → **USDC settled on Arbitrum One**.

**See it on-chain:** [this Arbiscan transaction](https://arbiscan.io/tx/0xa9f61dda499dba73374f4fd8f17b3bbf6a47f8e779b5f4c181293cd2e9371956) is a single production tip sent through the deployed app. In one bundle it shows the **EIP-7702 delegation** (`Delegate to 0x13E0…89A5A` — the Magic EOA upgraded in place), the **USDC transfer to the creator**, and Arbiscan's own *Account Abstraction Bundle* decoding. The fan-facing toast links to exactly this page ("Settled on Arbitrum ✓ — see it for yourself"), resolved live by watching the settlement transfer land (`lib/settlement.ts`).

**Battle scar worth knowing about:** Particle ran its V1→V2 migration *during* the hackathon, taking cross-chain routing down mid-build (`-32653` on every route; confirmed by their dev rel in the hackathon Discord on July 17). TipJet was migrated to SDK 2.0.3 the same evening, a probe monitored the router, and the first cross-chain settlement was fired within minutes of Particle's fix landing. Fans never saw a raw error at any point — the outage was mapped to "We couldn't move your balance just now — please try again in a few minutes."

---

## Pinned versions

| Package | Version | Why pinned |
|---|---|---|
| `next` | `15.5.19` | latest patched 15.5.x (15.5.7 had a security advisory) |
| `react` / `react-dom` | `19.1.0` | matches the verified-working Particle 7702 demo |
| `@particle-network/universal-account-sdk` | `2.0.3` | V2 stable. V1 (`1.1.1`) is being decommissioned — its routing returns maintenance errors |
| `magic-sdk` | `33.7.1` | exposes `wallet.sign7702Authorization` |
| `@magic-ext/oauth2` | `15.8.0` | Google login (optional) |
| `ethers` | `6.17.0` | signature serialization + `rootHash` signing |
| `tailwindcss` | `^4` | design tokens via `@theme` in `app/globals.css` |

---

## Setup & run

1. **Particle dashboard** → create a project → copy `projectId`, `clientKey`, `appId`. Confirm Universal Accounts / EIP-7702 is enabled. https://developers.particle.network
2. **Magic dashboard** → create an app → copy the **publishable** key (`pk_live_...`) → enable **Email OTP**. https://dashboard.magic.link
3. **(Optional for local dev) Upstash Redis** → create a database → copy the REST URL + token. Without it, the creator registry falls back to an in-memory + `/tmp` store — fine locally, **required in production** (serverless instances don't share memory).
4. **Fund a test account** with small real funds on a supported source chain that is *not* Arbitrum (e.g. USDC on Base) to demonstrate cross-chain sourcing. Universal Accounts only count balances on Arbitrum, Base, Ethereum, BNB Chain, X Layer, and Solana.
5. Environment + run:

   ```bash
   cp .env.example .env.local   # fill in real values
   npm install
   npm run dev                  # http://localhost:3000
   ```

> `.env.local` is gitignored. `NEXT_PUBLIC_*` vars are exposed to the browser — only publishable/client keys belong there. The `UPSTASH_*` vars are server-only.

---

## Project structure

```
app/
  page.tsx            # /            landing
  claim/              # /claim       creator onboarding (claim a handle)
  [handle]/           # /alex        public tip page — the core fan flow
  dashboard/          # /dashboard   creator balance + live tip feed + withdraw
  dev/                # /dev         Stage 0 smoke test — kept for judges/debugging
  api/creators/       # handle registry API (Upstash Redis; dev fallback)
components/           # client components (pages are thin ssr:false wrappers)
lib/
  magic.ts            # Magic email OTP + browser-only singleton + ethers signer
  universalAccount.ts # UA construction (EIP-7702 mode) + unified balance
  eip7702.ts          # Magic-flavored 7702 authorization signing (the hard part)
  send.ts             # build → authorize → sign → settle USDC on Arbitrum
  tokens.ts           # Arbitrum One + native USDC constants
  creators.ts         # creator types + client fetch helpers
  store.ts            # server-only registry (Upstash / in-memory fallback)
docs/
  SUBMISSION.md       # demo script, submission checklist, pitch-deck outline
  TipJet-Build-Guide.md
```

Every page that touches Magic or the UA SDK is a thin `"use client"` wrapper that loads its component with `dynamic(..., { ssr: false })` — both SDKs touch browser globals and must never run during SSR.
