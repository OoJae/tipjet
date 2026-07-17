# TipJet — Master Build Guide

> A complete, end-to-end plan for building **TipJet** for the UXmaxx Hackathon, optimized to win the **Universal Accounts Track (1st, $2,500)** and stack the **Arbitrum bounty ($2,000)** and **Magic bonus ($500)**. Written for a solo builder using Claude Code.
>
> Read this alongside `Research-Winning-UXmaxx-Hackathon.md` (the strategy) and `TipJet-Claude-Code-Master-Prompt.md` (the kickoff prompt).

---

## 0. What we're building (in one breath)

TipJet is a creator-tipping app that feels like Venmo, not like crypto. A creator shares a link (`tipjet.app/@alex`). A fan opens it on their phone, taps **Continue with Google**, sees their balance as a single dollar figure, taps **Tip $5**, approves once, and they're done. The creator instantly receives **USDC on Arbitrum** — spendable, in one place — even though the fan paid with a completely different token on a completely different chain. No bridges, no gas tokens, no chain selector, no seed phrase, ever.

**The magic moment we are selling to judges:** *Fan pays with ETH on Base (or SOL, or USDC on Polygon). Creator receives USDC on Arbitrum. Nobody touched a bridge, a gas token, or a chain switcher. The address never changed.* Everything in this build exists to make that one sentence true and to put it on screen.

### Success criteria (definition of done)
- [ ] A fan can go from cold open to "tip sent" in **under 30 seconds**, with no crypto vocabulary on screen.
- [ ] The fan's funds are sourced from **any chain/token** and land as **USDC on Arbitrum** for the creator.
- [ ] Login and signing are handled entirely by **Magic** (no MetaMask, no seed phrase).
- [ ] The account is a **Universal Account in EIP-7702 mode** — same address as the Magic EOA, upgraded in place.
- [ ] The app **runs primarily on Arbitrum** (settlement currency + any deployed components).
- [ ] Deployed public URL + GitHub repo + a tight demo video that shows the magic moment.

---

## 1. Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  TipJet (Next.js, deployed on Vercel)                                  │
│                                                                        │
│   Fan / Creator                                                        │
│        │                                                               │
│        ▼                                                               │
│   ┌─────────────┐   login + sign      ┌──────────────────────────┐    │
│   │  MAGIC SDK  │◄────────────────────│  app UI (tip widget,     │    │
│   │ (embedded   │  EOA address,       │  balance pill, dashboard)│    │
│   │  wallet)    │  sign7702Auth,      └──────────────────────────┘    │
│   └─────┬───────┘  personal_sign               │                      │
│         │ owner EOA                             │ build tx             │
│         ▼                                       ▼                      │
│   ┌──────────────────────────────────────────────────────────┐        │
│   │  PARTICLE UNIVERSAL ACCOUNTS SDK  (EIP-7702 mode)         │        │
│   │  - upgrades the Magic EOA in place (same address)        │        │
│   │  - getPrimaryAssets() → unified USD balance              │        │
│   │  - createTransferTransaction({ chain: ARBITRUM, USDC })  │        │
│   │  - Universal Liquidity sources funds from ANY chain      │        │
│   └───────────────────────────┬──────────────────────────────┘        │
│                               │ settles                                │
│                               ▼                                        │
│                    ┌─────────────────────┐                             │
│                    │  ARBITRUM ONE        │  ← creator receives USDC   │
│                    │  (settlement layer)  │     (optional: TipJar)     │
│                    └─────────────────────┘                             │
│                                                                        │
│   Lightweight store (Vercel KV / Upstash / Supabase):                  │
│   handle → { displayName, avatar, receivingAddress }                   │
└──────────────────────────────────────────────────────────────────────┘
```

**Roles in plain terms**
- **Magic** = the front door (login) and the pen (signing). It owns the user's keys in a TEE; the user just sees Google/email.
- **Particle Universal Accounts** = the brain. It turns the Magic EOA into a chain-abstracted account and does the cross-chain sourcing so the creator gets one clean currency.
- **Arbitrum** = the destination/settlement chain. Tips land here as USDC; any contract you deploy lives here.
- **The store** = a tiny database mapping a creator handle to a receiving address + profile. This is the only "Web2 backend" and it's deliberately minimal.

> **Why Magic as the signer specifically:** the client-side `magic-sdk` exposes `sign7702Authorization(...)`, which is exactly what the UA SDK needs to authorize the EIP-7702 upgrade. That one method is what lets a single wallet satisfy the Magic bonus *and* feed the EIP-7702 requirement of the UA track. (See §9 fallbacks if it misbehaves.)

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14+ (App Router) + TypeScript** | Mobile-first, deploys to Vercel in one click, server routes for the creator store |
| Styling | **Tailwind CSS + a few Framer Motion touches** | Fast to make beautiful; motion sells the "magic moment" (confetti, balance count-up) |
| Auth + signer | **`magic-sdk` (v33.4.0+)** + `@magic-ext/oauth2` for Google | Walletless login + `sign7702Authorization` for 7702 |
| Chain abstraction | **`@particle-network/universal-account-sdk`** | The UA + EIP-7702 engine; the heart of the track |
| Chain I/O helpers | **`ethers` v6** (and/or `viem`) | Signature serialization, reading USDC `Transfer` logs for the live feed |
| Store | **Upstash Redis / Vercel KV** (or Supabase free tier) | Creator registry; zero-ops, free tier is plenty |
| Settlement chain | **Arbitrum One** | Bounty requirement + clean USDC liquidity |
| (Optional) contract | **Foundry** (`TipJar.sol`) | A deployed-on-Arbitrum component + richer tip feed (messages) |
| Deploy | **Vercel** | One-command deploy, custom domain for the demo |

> Keep dependencies lean. Every extra library is a thing that can break the demo. The four that matter: `magic-sdk`, `@particle-network/universal-account-sdk`, `ethers`, and your store client.

---

## 3. Prerequisites & accounts (do this before any code)

- [ ] **Node 18+** installed.
- [ ] **Particle Dashboard project** → copy `projectId`, `clientKey`, `appId`. (https://dashboard.particle.network)
- [ ] **Magic Dashboard app** → copy the **publishable** API key (`pk_live_...`). Enable **Email OTP** (zero config) and, for the hero flow, **Google** social login (needs OAuth app setup). (https://dashboard.magic.link)
- [ ] **Upstash Redis** or **Vercel KV** instance → REST URL + token (or a Supabase project).
- [ ] **A small amount of real mainnet crypto for testing** (~$20–50 total), spread across **2–3 source chains** (e.g. a few dollars of ETH on Base, USDC on Polygon, plus something on Arbitrum). Universal Accounts liquidity is mainnet-oriented, so the live demo likely needs real (tiny) balances. **Keep balances small** because of the V2 migration warning.
- [ ] **Vercel account** for deployment + a domain (a `*.vercel.app` subdomain is fine; a real domain is a nice polish touch).
- [ ] **Foundry** installed *only if* you do the optional TipJar contract.

---

## 4. Repository structure

```
tipjet/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                 # landing / "claim your TipJet" 
│  ├─ [handle]/page.tsx        # PUBLIC tip page — the fan flow lives here
│  ├─ dashboard/page.tsx       # creator dashboard (balance + withdraw + feed)
│  └─ api/
│     ├─ creators/route.ts     # POST create profile, GET by handle
│     └─ feed/route.ts         # (optional) server-pushed tip feed
├─ components/
│  ├─ LoginButton.tsx          # "Continue with Google" (Magic)
│  ├─ TipWidget.tsx            # amount presets + Tip button + states
│  ├─ BalancePill.tsx          # unified USD balance, count-up animation
│  ├─ SettledToast.tsx         # "Settled on Arbitrum ✓" moment
│  └─ TipFeed.tsx              # live incoming tips
├─ lib/
│  ├─ magic.ts                 # Magic client init + login + provider
│  ├─ universalAccount.ts      # UA init (7702) + balance + transfer
│  ├─ eip7702.ts               # signature serialization + auth helpers
│  ├─ tokens.ts                # CHAIN_IDs, USDC addresses
│  └─ store.ts                 # creator registry (KV/Upstash/Supabase)
├─ contracts/                  # OPTIONAL
│  └─ TipJar.sol
├─ .env.local
└─ README.md                   # doubles as the submission writeup
```

---

## 5. Environment variables

```bash
# .env.local  (NEXT_PUBLIC_* are exposed to the browser — only publishable keys here)
NEXT_PUBLIC_PARTICLE_PROJECT_ID=
NEXT_PUBLIC_PARTICLE_CLIENT_KEY=
NEXT_PUBLIC_PARTICLE_APP_ID=
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# server-only (no NEXT_PUBLIC_ prefix)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

> Never commit `.env.local`. Magic's **publishable** key is browser-safe; Particle's `clientKey` is also a client key by design. The store credentials stay server-side only.

---

## 6. The staged build plan

> Build in this order. Each stage has a hard **acceptance gate** — do not move on until it's green. This sequencing front-loads the risky integration so you find problems in week 1, not week 5.

### Stage 0 — Architecture spike (the smoke test) — *Days 1–3*

**Goal:** prove the whole pipe works with zero product UI. One ugly button that does the entire chain-abstraction round trip.

Tasks:
- [ ] Scaffold the Next.js + TypeScript + Tailwind app.
- [ ] **Fetch the live docs/repos first** (they move fast and V2 is migrating): the Particle `universal-accounts-7702` demo, the Particle UA + Magic guide, and Magic's 7702 docs. Confirm exact current method names and the 7702 config shape.
- [ ] Wire `lib/magic.ts`: init Magic, log in with **Email OTP** (simplest; add Google in Stage 3), expose the EOA address and an ethers provider/signer.
- [ ] Wire `lib/universalAccount.ts`: construct a `UniversalAccount` in **EIP-7702 mode** with the Magic EOA as owner.
- [ ] Call `getPrimaryAssets()` and `console.log` the unified USD total — a non-zero number proves the UA is wired end-to-end.
- [ ] Build a `createTransferTransaction` sending a tiny amount of **USDC on Arbitrum** to a test address; handle the first-tx **EIP-7702 authorization** (sign with Magic, serialize, send).
- [ ] Confirm the transfer lands and print the explorer link.

**Acceptance gate:** From a fresh browser, you log in with email, see your real unified balance, click one button, and a tiny USDC transfer settles on Arbitrum — sourced from a token you hold on a *different* chain. If that works, the hard part of the hackathon is done.

### Stage 1 — Core fan tipping flow — *Days 4–10*

**Goal:** the public tip page. This is the thing judges will spend 80% of their time looking at.

Tasks:
- [ ] `app/[handle]/page.tsx`: load a creator profile by handle from the store; show avatar, name, and a tip widget.
- [ ] `components/LoginButton.tsx`: "Continue with Google / email" → Magic login, then silently spin up the UA.
- [ ] `components/BalancePill.tsx`: show the fan's unified balance as `$X.XX` with a count-up animation. Add a subtle tooltip: "Your balance across every chain, in one place."
- [ ] `components/TipWidget.tsx`: amount presets ($1 / $5 / $10 / custom) → **Tip** → states: idle → confirming → settling → success (confetti). Map "$5" → 5 USDC on Arbitrum to the creator's receiving address.
- [ ] Robust state handling: pending signature, routing in progress, success, failure with a friendly retry. Mask the few-second settle time with a pleasant "sending your tip…" animation.
- [ ] Zero crypto vocabulary in the UI. No "gas," "chain," "bridge," "wallet address." Just dollars, names, and a heart.

**Acceptance gate:** A stranger on their phone can open `/@you`, log in, and tip you $5 without you explaining anything. The creator's address receives Arbitrum USDC.

### Stage 2 — Creator side: profiles + dashboard + withdraw — *Days 11–17*

**Goal:** close the loop so it's a product, not a one-way demo. Doubles the UA showcase (creator is also a UA).

Tasks:
- [ ] `app/page.tsx` + `api/creators/route.ts`: "Claim your TipJet" — creator logs in with Magic, picks a handle, sets name/avatar; store `handle → { displayName, avatar, receivingAddress }` where the address is their Magic/UA address.
- [ ] `app/dashboard/page.tsx`: the creator's unified balance via `getPrimaryAssets()`, a **withdraw** action (`createTransferTransaction` to any external address — default to Arbitrum), and the live tip feed.
- [ ] `components/TipFeed.tsx`: **no contract needed** — watch USDC `Transfer` logs to the creator's address on Arbitrum (viem `watchEvent` or poll) and render incoming tips in real time. This is a cheap, high-impact demo flourish.
- [ ] Copy/share affordances: a shareable link and a QR code for the creator's page.

**Acceptance gate:** A new creator can self-serve a profile, share their link, watch a tip arrive live on their dashboard, and withdraw — all through Magic + UA, all Arbitrum-settled.

### Stage 3 — UX polish + the three judge-specific wins — *Days 18–28*

**Goal:** turn a working app into a *winning* one. This is where 40%-UX points are earned.

Tasks:
- [ ] **Magic win:** add **Google** social login as the primary button (email OTP as fallback). Make the first 30 seconds flawless and fully mobile-responsive. Test on an actual phone.
- [ ] **Particle win:** add the **"how it worked" reveal** — after a tip, a tasteful one-liner/animation: *"You paid with [token] on [chain] · Alex received USDC on Arbitrum · same address, no bridge."* Make EIP-7702 the visible hero, not a backend footnote. Show the unified balance prominently.
- [ ] **Arbitrum win:** a crisp **"Settled on Arbitrum ✓"** confirmation with an Arbiscan link. Frame the entire product as consumer-grade (no jargon). Keep settlement on Arbitrum everywhere.
- [ ] Design pass: real typography, a memorable name/logo, empty states, loading states, error states, a delightful success state. Dark mode optional.
- [ ] (Optional, if ahead) deploy `TipJar.sol` on Arbitrum to enrich the feed with tip **messages** and on-chain attribution — strengthens the "components deployed on Arbitrum" claim. Skip if it threatens the timeline.
- [ ] (Optional) group/round tipping (a GlobeSplit-style stretch) if the app feels too small.

**Acceptance gate:** Someone who has never seen TipJet says "wait, that's it? That was crypto?" — and you can point to the exact frame where the chain abstraction happened.

### Stage 4 — Demo, deploy, submit — *Days 29–35 (and across the milestone deadlines)*

**Goal:** ship, record, and submit so the work actually scores.

Tasks:
- [ ] Deploy to Vercel; set a clean URL; verify env vars in production.
- [ ] **Pre-fund 2–3 demo accounts** on different chains so the cross-chain routing visibly works on camera.
- [ ] Record a **60–90s demo video** following the script in §11. Record a **backup take** in case of mainnet latency on the day.
- [ ] Write the `README.md` / submission writeup that **explicitly addresses each rubric** (see §10).
- [ ] Submit on the Encode Club platform. Apply to the **Arbitrum Founder House** if the project is strong (check the deadline — see §12).

**Acceptance gate:** Public URL works, repo is clean, video shows the magic moment, writeup maps to all three rubrics, submission is in before the deadline.

---

## 7. Suggested 6-week calendar

| Week | Focus | Milestone |
|---|---|---|
| 1 | Stage 0 spike + scaffold | **Jun 29 23:59** — submit project outline / team / idea (hackathon milestone). Attend **Jun 25 Circle Gateway + UA** workshop (directly relevant to payments). |
| 2 | Stage 1 fan flow | Tip page works end-to-end on mainnet. Attend **Jun 30 Magic social login** workshop. |
| 3 | Stage 2 creator side | Full loop: claim → share → receive (live feed) → withdraw. |
| 4 | Stage 3 polish + judge wins | Google login, "how it worked" reveal, Arbitrum confirmations, design pass. |
| 5 | **Judging week** — buffer + demo | Deploy, pre-fund, record video, write rubric-mapped README, submit. |
| 6 | Finale + prizegiving (**Jul 30**) | Present. |

> The **Jun 25 Circle Gateway + Universal Accounts** workshop is worth attending even if you don't use Circle Gateway — it's literally about clean cross-chain *payment* flows with UA, which is exactly TipJet.

---

## 8. Integration deep-dives (reference patterns)

> ⚠️ **Read this first.** The snippets below are reference patterns based on the documented SDKs as of the research date. **Universal Accounts is mid-V2-migration**, so exact method names, parameter shapes, and the 7702 config can change. **Have Claude Code fetch the live `universal-accounts-7702` repo, the Particle UA+Magic guide, and Magic's 7702 docs and reconcile these patterns against them before relying on them.** Treat this as the shape of the solution, not gospel API.

### 8.1 Magic: login + provider + address

```ts
// lib/magic.ts
import { Magic } from "magic-sdk";
import { OAuthExtension } from "@magic-ext/oauth2"; // for Google

export const magic =
  typeof window !== "undefined"
    ? new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY!, {
        network: { rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL!, chainId: 42161 },
        extensions: [new OAuthExtension()],
      })
    : null;

// Email OTP (zero-config, great for Stage 0):
export async function loginEmail(email: string) {
  await magic!.auth.loginWithEmailOTP({ email });
  const { publicAddress } = await magic!.user.getInfo();
  return publicAddress!; // the EOA we hand to Universal Accounts
}

// Google (hero flow; needs OAuth app configured in the Magic dashboard):
export async function loginGoogle() {
  await magic!.oauth2.loginWithRedirect({
    provider: "google",
    redirectURI: `${window.location.origin}/callback`,
  });
}
```

### 8.2 Universal Account: init in EIP-7702 mode

```ts
// lib/universalAccount.ts
import { UniversalAccount, CHAIN_ID } from "@particle-network/universal-account-sdk";

export function makeUA(ownerEOA: string) {
  return new UniversalAccount({
    projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
    projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
    projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
    ownerAddress: ownerEOA,
    // 7702 mode — VERIFY exact key/placement against the live 7702 demo repo:
    smartAccountOptions: { useEIP7702: true },
    tradeConfig: { slippageBps: 100 }, // 1% slippage
  });
}
```

### 8.3 Unified balance (the balance pill)

```ts
const assets = await ua.getPrimaryAssets();
const usd = Number(assets.totalAmountInUSD); // render as "$X.XX"
```

### 8.4 Build + send a tip → USDC on Arbitrum (with 7702 auth)

```ts
// lib/tokens.ts
import { CHAIN_ID } from "@particle-network/universal-account-sdk";
// Native (Circle) USDC on Arbitrum One — VERIFY before relying on it:
export const ARBITRUM_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
export const ARBITRUM = CHAIN_ID.ARBITRUM_MAINNET_ONE;
```

```ts
import { getBytes } from "ethers";
import { magic } from "./magic";
import { serialize7702Auth } from "./eip7702";

export async function sendTip(ua, fanSigner, creatorAddress: string, dollars: string) {
  // 1) Build the cross-chain transfer: destination is Arbitrum USDC.
  const tx = await ua.createTransferTransaction({
    token: { chainId: ARBITRUM, address: ARBITRUM_USDC },
    amount: dollars,                 // "5" → 5 USDC
    receiver: creatorAddress,
  });

  // 2) First tx per chain: the SDK asks for an EIP-7702 authorization.
  const authReq = tx?.userOps?.find?.((o: any) => o.eip7702Auth)?.eip7702Auth;
  let authorizations: any[] = [];
  if (authReq) {
    const sig = await magic!.wallet.sign7702Authorization({
      chainId: authReq.chainId,
      contractAddress: authReq.address, // the UA delegate impl, supplied by the SDK
      nonce: authReq.nonce,
    });
    authorizations = [serialize7702Auth(sig)];
  }

  // 3) Sign the transaction rootHash with the Magic signer.
  const rootSig = await fanSigner.signMessage(getBytes(tx.rootHash));

  // 4) Broadcast. Universal Liquidity sources the funds from any chain the fan holds.
  const res = await ua.sendTransaction(tx, rootSig, authorizations);
  return res.transactionId; // → explorer link
}
```

### 8.5 The signature gotcha (Magic `v` → ethers `yParity`)

```ts
// lib/eip7702.ts
import { Signature } from "ethers";

// Magic returns { v: 27|28, r, s }; ethers/UA want yParity (0|1).
export function serialize7702Auth({ r, s, v, contractAddress, chainId, nonce }: any) {
  const yParity = v - 27;
  const serializedSig = Signature.from({ r, s, yParity }).serialized;
  // Shape the object the way the UA SDK expects — confirm against the repo:
  return { address: contractAddress, chainId, nonce, signature: serializedSig };
}
```

> This `v → yParity` mapping is the **most likely single point of breakage**. If signatures get rejected, this is the first place to look.

### 8.6 Getting an ethers signer from Magic

```ts
import { BrowserProvider } from "ethers";
const provider = new BrowserProvider(magic!.rpcProvider);
const fanSigner = await provider.getSigner();
```

### 8.7 Live tip feed without a contract

```ts
// Watch native USDC Transfer logs to the creator's address on Arbitrum.
import { createPublicClient, http, parseAbiItem } from "viem";
import { arbitrum } from "viem/chains";

const client = createPublicClient({ chain: arbitrum, transport: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL) });

client.watchEvent({
  address: ARBITRUM_USDC,
  event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)"),
  args: { to: creatorAddress },
  onLogs: (logs) => renderIncomingTips(logs),
});
```

### 8.8 Optional: `TipJar.sol` on Arbitrum (for messages/attribution)

```solidity
// contracts/TipJar.sol — OPTIONAL. Deploy on Arbitrum with Foundry.
// Lets you attach a message to a tip and emit a clean on-chain event for the feed.
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 { function transferFrom(address,address,uint256) external returns (bool); }

contract TipJar {
    event Tipped(address indexed from, address indexed to, uint256 amount, string message);
    IERC20 public immutable usdc;
    constructor(address _usdc) { usdc = IERC20(_usdc); }

    function tip(address to, uint256 amount, string calldata message) external {
        require(usdc.transferFrom(msg.sender, to, amount), "transfer failed");
        emit Tipped(msg.sender, to, amount, message);
    }
}
```

> Routing USDC *through* a contract via the UA (using `createUniversalTransaction` with `expectTokens` + an approve+call) is more involved than a direct transfer. Ship the **direct-transfer MVP** first; add TipJar only if you're ahead of schedule and want richer feed data and a stronger "deployed on Arbitrum" story.

---

## 9. Risk register & fallbacks

| Risk | Likelihood | Mitigation / fallback |
|---|---|---|
| **Magic `sign7702Authorization` incompatible with UA bundler/paymaster path** | Medium | Test in **Stage 0**. Fallback A: use a **Privy or Particle Auth signer** for the 7702/UA track, and integrate the **Magic API Wallet (non-7702)** elsewhere to still claim the Magic bonus. Fallback B: use Magic API Wallet's documented classic-4337 path and present 7702 via the supported provider. (Splits the architecture but preserves all three prizes.) |
| **Signature serialization rejected** (`v`/`yParity`) | Medium | §8.5 is the first suspect; log raw `{v,r,s}` and the serialized output, compare against the repo's helper. |
| **UA V2 ships mid-hackathon with breaking changes** | Medium | **Pin** the SDK version your demo works on; document it in the README; don't chase V2. |
| **Mainnet routing latency on demo day** | Medium | Pre-fund accounts; mask with good "sending…" UX; record a **backup video**. |
| **Needs real mainnet funds to demo** | High (expected) | Budget ~$20–50; keep balances tiny per the V2 warning. |
| **Native USDC address / chain-id constant wrong** | Low | Verify `ARBITRUM_USDC` and `CHAIN_ID.ARBITRUM_MAINNET_ONE` against the docs in Stage 0. |
| **App feels too thin by week 3** | Low | Bolt on group/round tipping (GlobeSplit stretch) rather than switching ideas. |

---

## 10. Prize-stacking checklist (map every feature to a rubric)

> Address each of these **explicitly** in the README/submission. The bonuses are judged independently — don't assume the UA submission auto-qualifies.

**Universal Accounts Track — UX 40 / Innovative UA+7702 30 / Adoption 20 / Polish 10**
- [ ] UX: Google/email login, one-tap tip, unified balance pill, zero chain/gas/bridge UI.
- [ ] Innovative UA+7702: Magic EOA upgraded **in place** via 7702 (same address); cross-chain liquidity sourced automatically; **both** fan and creator are Universal Accounts.
- [ ] Adoption: real creator-economy use case; Arbitrum-USDC payouts are spendable; clear go-to-market.
- [ ] Polish: responsive, fast, graceful states.

**Arbitrum "Road to Open House London" — UX 30 / Creativity 30 / Adoption 20 / Execution 20**
- [ ] **Runs primarily on Arbitrum:** every tip settles as **USDC on Arbitrum**; (optional) TipJar deployed on Arbitrum; withdrawals default to Arbitrum.
- [ ] Reads like a **normal consumer product** (no crypto jargon).
- [ ] Creativity: "tip with anything, creator gets one clean currency" is a fresh framing.
- [ ] Have a **one-line business pitch** ready for the Founder House application.

**Magic Labs bonus — smooth onboarding / creative use / polish / consumer-ready / technical quality**
- [ ] Magic is the **login + signer** (no MetaMask, no seed phrase).
- [ ] Onboarding: Google/email, instant wallet, mobile-friendly, flawless first 30 seconds.
- [ ] Creative use: the Magic wallet **doubles as the 7702 signer** feeding the UA — a clean, non-obvious integration.

---

## 11. Demo script (60–90 seconds)

> Record landscape on desktop *and* a phone capture of the login. Keep it tight; the magic moment must land by ~0:30.

- **0:00** — "This is TipJet. It's how you tip a creator with crypto — except it doesn't feel like crypto." Show creator page `/@alex`.
- **0:05** — Tap **Continue with Google**. In seconds, logged in. *Say:* "No seed phrase. No wallet install. That's Magic." *(Magic win.)*
- **0:15** — Show the balance pill: "$23.40." *Say:* "This is ETH on Base, USDC on Polygon, and some SOL — shown as one balance. That's Particle's Universal Accounts." *(Particle win.)*
- **0:25** — Tap **Tip $5** → one approval → confetti → "Sent! ❤️".
- **0:30** — Cut to Alex's dashboard: a tip pings in live. **"+$5.00 USDC · Settled on Arbitrum ✓"** with an Arbiscan link. *(Arbitrum win + the magic moment.)*
- **0:40** — The reveal line on screen: *"The fan paid with a token on a different chain. Alex received USDC on Arbitrum. Nobody touched a bridge, a gas token, or a chain selector. Same address throughout."*
- **0:55** — "One login. One balance. Any chain. Just maxxed UX." End on the logo.

---

## 12. Submission & deadlines checklist

- [ ] **Jun 29 23:59** — milestone: create project, add team (solo is fine), share the idea outline. **Do this in week 1.**
- [ ] Attend high-value workshops: **Jun 25** Circle Gateway + UA (payments), **Jun 30** Magic social login, and the ZeroDev/Openfort/Arbitrum sessions as useful.
- [ ] **Week 5** — judging week: have the deployed URL, repo, video, and rubric-mapped README ready.
- [ ] **Jul 30** — Finale & Prizegiving.
- [ ] **Arbitrum Founder House London (Jul 10–12)** — application-based, limited capacity. Strong TipJet = apply. **Verify the application deadline immediately** (it may close around late June, i.e. *before* the hackathon ends), and have a one-paragraph business pitch ready.
- [ ] Final submission contents: **deployed demo URL + public GitHub repo + 60–90s demo video + writeup that explicitly maps to all three rubrics** (§10).

---

## 13. Reference links

- Particle UA quickstart: https://developers.particle.network/universal-accounts/web-quickstart
- Particle UA + Magic guide: https://developers.particle.network/universal-accounts/how-to/ua-magic
- Particle 7702 demo repo: https://github.com/Particle-Network/universal-accounts-7702
- Particle EIP-7702 post: https://blog.particle.network/eip-7702/
- Magic embedded wallets: https://docs.magic.link/embedded-wallets/introduction
- Magic 7702 feature: https://docs.magic.link/embedded-wallets/wallets/features/eip-7702
- Magic OAuth (social login): https://docs.magic.link/embedded-wallets/authentication/login
- Arbitrum docs: https://docs.arbitrum.io/
- Arbitrum consumer apps: https://arbitrum.io/solutions/consumer
- Native USDC on Arbitrum (Circle): verify current address via https://www.circle.com/multi-chain-usdc/arbitrum
- Upstash Redis: https://upstash.com/ · Vercel KV: https://vercel.com/docs/storage/vercel-kv

---

### Final note
Build Stage 0 first. If the smoke test in §6 goes green in week 1, you are in a commanding position — everything after it is product and polish, which is where you'll out-execute the field. The research lives in `Research-Winning-UXmaxx-Hackathon.md`; the kickoff prompt for Claude Code is in `TipJet-Claude-Code-Master-Prompt.md`.
