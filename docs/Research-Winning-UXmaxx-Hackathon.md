# Winning the UXmaxx Hackathon: Stacking Universal Accounts + Arbitrum + Magic in One App

> Research & strategy report. Source for the TipJet build decision.

## TL;DR

- **Build one app, win three prizes with one architecture.** Magic's embedded wallet logs the user in and becomes the signer → Particle's Universal Accounts SDK upgrades that EOA into a chain-abstracted account in EIP-7702 mode → all transactions execute primarily on Arbitrum. This single stack satisfies the Universal Accounts Track ($2,500), the Magic embedded-wallet bonus ($500), and the Arbitrum "Road to Open House London" bounty ($2,000) — a combined **$5,000** plus a real shot at Particle incubation and an Arbitrum Founder House (July 10–12) invite.
- **The championing idea is "TipJet": a creator-tipping / pay-any-creator consumer app** where a fan logs in with Google, holds whatever token on whatever chain, and tips a creator who instantly receives USDC on Arbitrum — no bridge, no gas token, no chain selection ever visible. It scores highest on the weighted criteria because tipping/payments demos in 10 seconds, the chain-abstraction "magic moment" (pay with SOL → creator gets Arbitrum USDC) is visceral, and it reads as a normal consumer product, not a crypto toy.
- **Two hard constraints shape everything:** (1) Universal Accounts is mid-migration to V2 with a live "withdraw your funds / new account system" warning — build against the current SDK but expect API churn and keep balances tiny; (2) Arbitrum is a first-class, 7702-supported execution chain for Universal Accounts, so "primarily on Arbitrum" is technically clean — set Arbitrum as the destination chain for every value-moving operation.

## Key Findings

### The three-in-one architecture is real, documented, and Particle actively wants you to build it

Particle Network shipped full EIP-7702 support for Universal Accounts in March 2026, explicitly launching it with three wallet providers out of the box. Particle's own announcement states the solution works out of the box with three popular wallet providers — Privy, Dynamic, and **Magic Labs**. The UXmaxx hackathon (June 22, 2026, six weeks, 100% online) is run by the "7702 Collective" — led by Particle Network with the support of **Arbitrum, Magic, ZeroDev, and Openfort**. The sponsors of your three target prizes are literally the co-organizers of the hackathon, which means an app that elegantly stacks all three is exactly the flagship outcome they hope to showcase.

### How the stack works technically

1. **Login / signer (Magic bonus):** Magic creates a non-custodial EOA via passwordless/social login. Two paths exist:
   - **Client-side `magic-sdk` embedded wallet** — exposes a dedicated `magic.wallet.sign7702Authorization({ contractAddress, chainId, nonce? })` method (requires `magic-sdk` v33.4.0+) that returns `{ contractAddress, chainId, nonce, v, r, s }`. This is the natively 7702-capable path.
   - **Magic API Wallet (TEE)** — the path in Particle's published Magic+UA guide; the private key is generated and stored in Magic's TEE and never leaves. That published guide uses the classic ERC-4337 path (`personalSign(rootHash)`, no 7702 flag).
2. **Account (UA Track):** Initialize a `UniversalAccount` with EIP-7702 mode enabled and the Magic EOA as owner. The EOA becomes a Universal Account in place — same address, no migration, no separate smart-account deployment.
3. **Cross-chain operation (UA Track + Arbitrum bounty):** Build a transaction targeting Arbitrum (`createTransferTransaction` / `createUniversalTransaction`). On the first transaction per chain the SDK returns userOps carrying an EIP-7702 authorization object; the Magic signer signs the authorization, the app serializes it, signs the transaction `rootHash`, and sends. Subsequent transactions on that chain need no re-authorization. Universal Liquidity routes the user's assets from any chain into the destination asset on Arbitrum automatically.

### Key technical gotchas for a 6-week solo build

- **Signature format conversion.** Magic returns `{ v: 27|28, r, s }`; the UA SDK example (Privy path) builds the serialized signature from `{ r, s, yParity }`. You must map `yParity = v − 27` and serialize. This is the single most likely integration snag.
- **Client SDK vs API Wallet for 7702.** The dedicated `sign7702Authorization` method is documented for the **client-side `magic-sdk`**, not the TEE Express API Wallet, whose published Particle guide uses the **non-7702** classic path. To satisfy the UA Track's explicit "EIP-7702 mode" requirement AND the Magic bonus cleanly, default to the **client-side `magic-sdk` embedded wallet** as your signer.
- **V2 migration warning is live.** Particle's docs carry a prominent notice that Universal Accounts are upgrading to V2, requiring users to withdraw funds from old accounts. Build against the current public SDK, keep test balances small, withdraw via `createTransferTransaction`, and watch for breaking changes during the six weeks.
- **7702 chain support is finite.** Per Particle's own 7702 demo: Ethereum, Arbitrum, Base, Optimism, Polygon, BNB Chain, Sonic, Berachain. Arbitrum is supported. Universal Accounts broadly span ~15+ EVM chains plus Solana; Primary (deep-liquidity) tokens are BNB, BTC, ETH, USDC, USDT, SOL.
- **First-tx latency.** The first cross-chain op per chain incurs the 7702 authorization plus cross-chain routing. Design demos around payment/tipping flows where a few seconds of "settling" is acceptable and can be masked with good UX, not around HFT-style instant trading.

### Competitive landscape — where the white space is

- **Particle's own flagship is UniversalX**, a chain-abstracted trading terminal. Do NOT build a trading app — you'll be compared directly to the sponsor's mature product and lose on polish.
- **Arbitrum's consumer showcases** (e.g. Blackbird restaurant loyalty/payments with 100,000+ self-custodial wallets; the stablecoin-settlement-layer narrative with billions in stablecoin transfer volume) point to where Arbitrum wants consumer apps: payments, loyalty, commerce. Arbitrum is explicitly positioning as a consumer payments/settlement rail.
- **EIP-7702 white space:** session keys, gas sponsorship, batched "approve+swap," subscription/recurring payments, and consumer/social/gaming apps that default to 7702. Most production 7702 usage so far is wallets and trading agents — **consumer payment, social, loyalty, and AI-agent-payment apps are comparatively unexplored**, which is exactly where UX-excellence points are easiest to win.
- **The x402 agentic-payments narrative is hot**, and the Coinbase CDP facilitator handles ERC-20 payments on Base, Polygon, **Arbitrum**, World, and Solana. Combining x402 with Universal Accounts for an AI agent that pays from a unified cross-chain balance and settles on Arbitrum is genuinely novel territory (high-ceiling, high-risk).

### What makes judges from Particle, Arbitrum, and Magic say "blown away"

- **Particle (30% innovative UA + 40% UX):** a "magic moment" where the user pays with a token on chain A and value lands on Arbitrum with no bridge UI, no chain switcher, no gas token — and the address never changes. They want EIP-7702 as the headline mechanic, not buried.
- **Arbitrum (30% UX, 30% creativity):** an app that "feels less like a crypto app and more like a normal consumer product," with Arbitrum as the invisible settlement layer. Bonus for a clear path to a real business (they're recruiting for Founder House).
- **Magic (smooth onboarding, consumer-ready):** email/Google login, instant wallet, zero seed phrase, mobile-friendly. They reward the onboarding flow specifically — make the first 30 seconds flawless.

## The Five Candidate Ideas

**1 — "TipJet": pay-any-creator / universal tipping (RECOMMENDED CHAMPION).** A creator shares a link/QR. A fan logs in with Google (Magic), tips "$5." The fan can hold ETH on Base, USDC on Polygon, SOL — they just see "$5." The creator receives USDC on Arbitrum, instantly spendable. No bridge, no gas, no chain ever shown. Lowest build risk, highest UX demo density, and the cross-chain action *is* the product.

**2 — "GlobeSplit": cross-border group expense / bill-splitting.** Splitwise-style; friends in different countries settle a shared bill, each paying in whatever they hold, recipient gets USDC on Arbitrum. Strong adoption story, medium build risk (group state, invites).

**3 — "AutoPay Agent": AI agent with an invisible cross-chain wallet (x402 + UA).** An AI assistant that pays for APIs/services on your behalf from a unified balance, settling via x402 on Arbitrum. Highest novelty ceiling, highest build risk (many moving parts, demo reliability risk).

**4 — "OneTap Checkout": embeddable chain-abstracted commerce/checkout widget.** "Pay with crypto" button; customer pays with any token on any chain, merchant receives Arbitrum USDC. Best "real business" story for Founder House; medium build risk (needs believable storefront + merchant side).

**5 — "QuestPocket": walletless mobile game/loyalty with cross-chain rewards.** Players earn/spend rewards, deposit from any chain, rewards settle on Arbitrum, gasless play. Games demo well but game content + economy is expensive to polish solo in six weeks (high risk).

### Comparative verdict

| Idea | UX (40) | UA (30) | Adopt (20) | Polish (10) | Arb fit | Magic fit | Build risk | Overall |
|---|---|---|---|---|---|---|---|---|
| 1 TipJet | ★★★★★ | ★★★★★ | ★★★★ | ★★★★★ | Excellent | Excellent | Low | **Best** |
| 2 GlobeSplit | ★★★★ | ★★★★ | ★★★★★ | ★★★ | Strong | Strong | Med | Strong |
| 3 AutoPay Agent | ★★★ | ★★★★★ | ★★★★ | ★★ | Strong | Strong | High | High-ceiling/high-risk |
| 4 OneTap Checkout | ★★★★ | ★★★ | ★★★★★ | ★★★ | Excellent | Strong | Med | Strong (best business) |
| 5 QuestPocket | ★★★★ | ★★★ | ★★★ | ★★ | Strong | Excellent | High | Risky |

## Recommendations

**Stage 0 — Lock the architecture.** Use the **client-side `magic-sdk` embedded wallet** (v33.4.0+) as signer specifically because it exposes `sign7702Authorization`. Clone Particle's `universal-accounts-7702` (Privy) demo as the structural template, swap the signer for Magic, and reuse its EIP-7702 helper pattern. Also pull Particle's `ua-7702-magic-demo` repo as the closest Magic-specific reference. Set Arbitrum as the destination for every value-moving operation. Get "login → unified balance → one cross-chain tx to Arbitrum" green before any product UI.

**Stage 1 — Build TipJet.** Best risk-adjusted path to 1st place. Ship the fan flow first (login → tip → success), then a minimal creator dashboard (unified balance + withdraw).

**Stage 2 — Nail the three judge-specific wins.** Magic: flawless first 30 seconds, mobile-friendly. Particle: put the "paid with X on chain A, landed as Arbitrum USDC, address unchanged" moment front and center. Arbitrum: show a "settled on Arbitrum" confirmation, frame as a consumer product, prepare a one-line business pitch for the Founder House application.

**Stage 3 — De-risk the demo.** Pre-fund test accounts on 2–3 source chains so cross-chain routing visibly works live. Record a backup demo video in case of mainnet latency. Keep balances tiny given the V2 migration warning.

**Benchmarks that would change the plan.** If the UA V2 SDK ships mid-hackathon with breaking changes → pin to the version your demo works on. If Magic's client `sign7702Authorization` proves incompatible with Particle's UA bundler/paymaster path → fall back to the documented Magic API Wallet (non-7702) for the Magic bonus and present 7702 via a Privy/Particle-Auth signer for the UA track. If TipJet feels too small by week 3 → bolt on GlobeSplit-style group tipping. For maximum novelty → AutoPay Agent, but only if Stage 0 goes flawlessly.

## Caveats

- **V2 migration is in flight.** The current SDK works, but Particle is actively rolling out V2 with an explicit "withdraw funds / new account system" warning. Expect possible API changes during the six weeks; this is the biggest schedule risk.
- **The `ua-7702-magic-demo` repo exists but its exact code/README could not be fully retrieved in this research.** The recommended architecture is inferred from the confirmed `universal-accounts-7702` (Privy) demo, the published Magic+UA API-Wallet guide, and Magic's documented `sign7702Authorization` method. Validate the exact Magic-as-7702-signer flow against the live repo/docs on Day 1.
- **Signature-format conversion (Magic `v` → `yParity`) is an unverified but likely integration snag** — budget time for it.
- **Prize amounts/pool:** the bonus amounts ($2,500 UA 1st, $2,000 Arbitrum, $500 Magic) are per the hackathon brief; the public Particle blog states a ~$15.5K total pool (an earlier announcement said $12K+). Confirm exact per-prize amounts and judging logistics on the official Encode Club hackathon page.
- **Independent judging:** the Arbitrum and Magic bounties are judged independently of the main track, so stacking is additive — but each has its own criteria you must explicitly satisfy. Don't assume the UA track submission auto-qualifies; address each rubric directly in your submission.
- **Forward-looking items flagged as such:** Particle's "Universal Agent Accounts" and "Universal Deposit SDK" are announced roadmap items, not necessarily production-ready during the hackathon — don't build a winning entry that depends on them.

## Reference Links

- Particle UA overview: https://developers.particle.network/universal-accounts/overview
- Particle UA web quickstart: https://developers.particle.network/universal-accounts/web-quickstart
- Particle UA + Magic guide: https://developers.particle.network/universal-accounts/how-to/ua-magic
- Particle 7702 demo repo: https://github.com/Particle-Network/universal-accounts-7702
- Particle EIP-7702 announcement: https://blog.particle.network/eip-7702/
- Magic embedded wallets: https://docs.magic.link/embedded-wallets/introduction
- Magic 7702 feature: https://docs.magic.link/embedded-wallets/wallets/features/eip-7702
- Arbitrum consumer: https://arbitrum.io/solutions/consumer
- Arbitrum docs: https://docs.arbitrum.io/
- ZeroDev SRA (alt routing): https://docs.zerodev.app/cross-chain/smart-routing-address
- UXmaxx announcement: https://blog.particle.network/join-the-uxmaxx-hackathon-15-5k-for-grabs-100-online/
