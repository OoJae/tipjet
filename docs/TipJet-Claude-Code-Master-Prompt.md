# TipJet — Claude Code Master Prompt

> Copy the block below into Claude Code at the root of an empty project folder. Keep `TipJet-Build-Guide.md` and `Research-Winning-UXmaxx-Hackathon.md` in the same folder so Claude Code can read them.
>
> This kickoff prompt deliberately drives Claude Code to **verify the live SDKs and build the Stage 0 smoke test first**, before any product UI. That sequencing is the single most important thing for de-risking this build. Follow-up prompts for each subsequent stage are at the bottom.

---

## ▶ The master prompt (copy everything between the lines)

---

You are my senior full-stack engineer for a 6-week solo hackathon project. We are building **TipJet**, a creator-tipping web app for the UXmaxx Hackathon. The goal is to win the **Particle Network Universal Accounts Track** and stack the **Arbitrum** and **Magic Labs** bonus prizes with a single architecture.

**Before writing any code, read these two files in this folder in full and treat them as the spec: `TipJet-Build-Guide.md` (the build plan, architecture, integration patterns, and acceptance gates) and `Research-Winning-UXmaxx-Hackathon.md` (the strategy and constraints).** Everything below is a summary; the build guide is authoritative.

### What TipJet does
A fan opens a creator's link, logs in with Google/email (no seed phrase, no wallet install), sees their balance as a single dollar figure, and taps "Tip $5." The creator instantly receives **USDC on Arbitrum** — even though the fan paid with a different token on a different chain. No bridges, no gas tokens, no chain selector, ever. The product must feel like Venmo, not like crypto.

### The architecture (one stack, three prizes)
- **Magic (`magic-sdk`, client-side, v33.4.0+)** = login + signer. It exposes `sign7702Authorization(...)`, which we use to authorize the EIP-7702 upgrade. This satisfies the **Magic bonus**.
- **Particle Universal Accounts SDK (`@particle-network/universal-account-sdk`) in EIP-7702 mode** = turns the Magic EOA into a chain-abstracted account *in place* (same address), provides the unified balance via `getPrimaryAssets()`, and routes cross-chain liquidity automatically. This satisfies the **Universal Accounts Track**.
- **Arbitrum One** = the settlement chain. Every tip lands as **USDC on Arbitrum**. This satisfies the **Arbitrum bounty** ("must run primarily on Arbitrum").
- A tiny store (Upstash Redis / Vercel KV) maps `handle → { displayName, avatar, receivingAddress }`.

### Tech stack
Next.js 14+ (App Router) + TypeScript + Tailwind CSS, `magic-sdk` + `@magic-ext/oauth2`, `@particle-network/universal-account-sdk`, `ethers` v6 (and `viem` for reading logs), Upstash Redis or Vercel KV, deployed on Vercel. Mobile-first.

### CRITICAL — do this before coding
The Universal Accounts SDK is **mid-migration to V2** and these APIs move fast. **First, fetch and read the current live sources and reconcile the build guide's reference patterns against them:**
1. The Particle 7702 demo repo: `https://github.com/Particle-Network/universal-accounts-7702` (study its EIP-7702 auth/signature helper and the exact `UniversalAccount` 7702 config).
2. The Particle UA + Magic guide: `https://developers.particle.network/universal-accounts/how-to/ua-magic`.
3. Magic's 7702 docs: `https://docs.magic.link/embedded-wallets/wallets/features/eip-7702`.
4. The Particle UA quickstart for the verified base API: `https://developers.particle.network/universal-accounts/web-quickstart`.

Confirm: the exact `UniversalAccount` constructor shape for **7702 mode**, the exact `sendTransaction` signature when passing EIP-7702 authorizations, the method names for `getPrimaryAssets` / `createTransferTransaction`, the correct `CHAIN_ID` constant for Arbitrum One, and the **native USDC address on Arbitrum**. If anything in the build guide's §8 snippets is stale, fix it to match the live API and tell me what changed.

### Known gotcha to handle carefully
Magic returns signatures as `{ v: 27|28, r, s }`, but ethers/UA expect `yParity` (0|1). Map `yParity = v - 27` and serialize with `ethers.Signature.from({ r, s, yParity }).serialized`. This is the most likely point of breakage — log raw and serialized signatures so we can debug fast.

### YOUR FIRST TASK: Stage 0 — the smoke test (no product UI yet)
Build the minimum that proves the entire chain-abstraction pipe works end to end. One ugly button is fine. Concretely:
1. Scaffold the Next.js + TypeScript + Tailwind project with the structure in the build guide (§4), including `lib/magic.ts`, `lib/universalAccount.ts`, `lib/eip7702.ts`, `lib/tokens.ts`.
2. Set up `.env.local` with the variables in §5 (use placeholders; I'll fill in real keys). Never hardcode secrets; `.gitignore` the env file.
3. Implement: **Email OTP login via Magic** → get the EOA address → construct a `UniversalAccount` in **EIP-7702 mode** with that EOA as owner.
4. Fetch and display the **unified balance** (`getPrimaryAssets().totalAmountInUSD`).
5. On a button click, build a `createTransferTransaction` for a **tiny amount of USDC on Arbitrum** to a hardcoded test address, handle the **first-transaction EIP-7702 authorization** (sign with Magic, serialize, send via `sendTransaction`), and print the explorer link.
6. Add clear console logging at each step and friendly on-screen status (logging in → fetching balance → building tx → signing auth → settling → done/error).

**Acceptance for Stage 0:** from a fresh browser, I log in with email, see my real unified balance, click the button, and a tiny USDC transfer settles on Arbitrum sourced from a token on a different chain. Do not start building the tip UI until this passes.

### How I want you to work
- Work in **small, verifiable increments**. After each meaningful step, tell me exactly what to test and how to confirm it works before continuing.
- Use TypeScript throughout with clear types for the UA/Magic objects.
- Prefer the four core dependencies; don't add libraries we don't need.
- When the live API differs from the build guide, **follow the live API** and note the discrepancy.
- Flag anything that needs a real account/key/test funds from me, and pause for it rather than guessing.
- Keep accessibility and mobile responsiveness in mind from the start, but don't gold-plate Stage 0 — it's a smoke test.
- Write a running `README.md` documenting setup steps and the pinned SDK versions as we go (this doubles as my submission writeup later).

Start by reading the two spec files, then fetching the four live sources, then report back with: (a) any corrections to the build guide's integration patterns, (b) the exact dependency versions you'll install, and (c) your plan for Stage 0. Then build Stage 0.

---

## ▶ Follow-up prompts (use after each acceptance gate passes)

**After Stage 0 passes → Stage 1 (fan flow):**
> Stage 0 is green. Now build Stage 1 from `TipJet-Build-Guide.md` §6: the public tip page at `app/[handle]/page.tsx`. Implement `LoginButton`, `BalancePill` (unified USD with count-up), and `TipWidget` ($1/$5/$10/custom → Tip → idle/confirming/settling/success with confetti), mapping dollars to USDC on Arbitrum to the creator's address. Zero crypto vocabulary in the UI. Robust pending/success/error states that mask settle latency. Acceptance: a stranger on a phone can open `/@me`, log in, and tip $5 with no explanation.

**After Stage 1 → Stage 2 (creator side):**
> Build Stage 2: the "Claim your TipJet" onboarding (`app/page.tsx` + `api/creators/route.ts` storing `handle → {displayName, avatar, receivingAddress}` in Upstash/KV), the creator `dashboard` with unified balance + withdraw (`createTransferTransaction` to an external address, default Arbitrum), a shareable link + QR, and `TipFeed` that watches USDC `Transfer` logs to the creator's address on Arbitrum (viem `watchEvent`) and renders tips live. No contract needed. Acceptance: claim → share → receive live → withdraw, fully through Magic + UA, Arbitrum-settled.

**After Stage 2 → Stage 3 (polish + judge wins):**
> Build Stage 3: add Google social login as the primary button (email OTP fallback); add the post-tip "how it worked" reveal ("You paid with [token] on [chain] · creator received USDC on Arbitrum · same address, no bridge"); add a crisp "Settled on Arbitrum ✓" confirmation with an Arbiscan link; do a full design pass (typography, logo, empty/loading/error/success states); confirm mobile responsiveness on a real phone. Map every feature to the three rubrics in §10. Optional only if ahead: deploy `TipJar.sol` on Arbitrum for tip messages.

**After Stage 3 → Stage 4 (ship):**
> Build Stage 4: deploy to Vercel with production env vars, finalize the `README.md` so it explicitly addresses each of the three rubrics in §10, and give me a tight checklist for recording the 60–90s demo video in §11 plus a backup take. Pre-flight: verify the deployed URL works end-to-end with a real tiny tip.

---

### Tips for steering Claude Code on this project
- If signatures get rejected, point it straight at the `v → yParity` serialization (`lib/eip7702.ts`) first.
- If Magic's `sign7702Authorization` won't play with the UA path, invoke the fallback in build guide §9 (Privy/Particle-Auth signer for 7702 + Magic API Wallet for the bonus) rather than abandoning a prize.
- Pin SDK versions the moment Stage 0 works, and tell Claude Code not to upgrade toward UA V2 mid-build.
- Keep test balances tiny (the V2 migration warning) and keep a pre-funded set of demo accounts on 2–3 chains for filming.
