# TipJet — Submission Pack (Encode UXmaxx)

## 1. One-line pitch

**TipJet is the tip jar that works like Venmo: fans pay with whatever they hold on any chain, creators receive clean USDC on Arbitrum — email login, two taps, zero crypto vocabulary.**

---

## 2. Demo video script (90 seconds, timestamped)

> Record landscape on desktop, plus a phone capture of the login for the first beat.
> The magic moment must land by ~0:30. Keep the cursor slow and deliberate.
>
> **Staging (do this before hitting record):** fan session in Browser A (or the
> phone) logged in with the funded demo email; creator dashboard open in
> Browser B, already logged in. One browser cannot hold both sessions — Magic
> keeps one login per origin. Do a full rehearsal tip first so the 7702
> authorization is already done and the demo take gets the fastest path.

| Time | On screen | Say |
|---|---|---|
| **0:00** | Hook: a creator's tip page (`/alex`) — big "$5" button, goal bar part-filled, supporter wall with a few notes, no signup wall | "This is TipJet. It's how you tip a creator with crypto — except it never feels like crypto." |
| **0:07** | Type email → 6-digit code → logged in | "No seed phrase. No wallet install. No extension. That's Magic — and behind that code, an account already exists." |
| **0:18** | The balance pill appears: **$23.40** | "That's everything I hold, across several chains, shown as one number. Particle Universal Accounts — and it's the *same address* as my email login, upgraded in place with EIP-7702." |
| **0:26** | Type a note — **From Jide: "your videos got me through finals ❤️"** — tap **Tip $5** → spinner → success pop | "One tap — and the tip carries a message. No gas prompt, no chain selector." |
| **0:32** | **The receipt card:** *"You paid from Base → Alex received dollars on Arbitrum · same account, no bridge"* — hold on it | "That one card is the whole product. Two different chains, one account, and nobody touched a bridge." |
| **0:38** | The toast upgrades live to **"Settled on Arbitrum ✓"** — click **"See it for yourself ↗"** and the Arbiscan transfer fills the frame | "And it's not a claim — here's the transfer, on Arbitrum, verifiable by anyone." |
| **0:45** | Cut to the creator dashboard: **"+$5.00 · just now"** pings into the live feed, Jide's note right under it in the notes-from-fans list | "The creator sees it land live — with the message attached — and can withdraw: it's native USDC on Arbitrum, spendable anywhere." |
| **0:52** | Back on `/alex`: the **supporter wall** gains Jide's note at the top and the **goal bar ticks up** toward "New mic fund" | "Every tip goes public on the wall and moves the goal — the page gets more convincing with every supporter." |
| **1:05** | End on the wall, then the creator's **QR code** flashes up full-frame with the live URL · Magic × Particle × Arbitrum | "Stick it on a stream, a bio, a merch table. One login. One balance. Any chain. TipJet." |

**Fallback line (if Particle's cross-chain routing is still paused on recording day)** — deliver at ~0:20, over the balance pill:

> "Funds here are on Arbitrum today; the same tap routes from any chain — Particle is finishing their V2 cutover this week."

Then proceed with the same-chain send unchanged — the code path is identical, and the README's status note explains the outage honestly.

---

## 3. Submission checklist (Encode requirements)

- [ ] **Public GitHub repo** — clean history, rubric-mapped `README.md`, `.env.example` complete, no secrets committed.
- [ ] **Live demo link** — Vercel deploy with `UPSTASH_*` set (the in-memory registry does not survive serverless); pre-claim a demo creator handle; pre-fund the demo fan account (small amounts, on Base for the cross-chain story or Arbitrum for the guaranteed-works story).
- [ ] **Demo video** — 60–90 s, script above; record BOTH takes (cross-chain and same-chain fallback) so the stronger one ships.
- [ ] **Pitch deck / presentation** — 6 slides, outline in §4.
- [ ] **Clear explanation** of what it does and how each sponsor technology is used — covered by `README.md` (architecture diagram + per-rubric mapping) and this document.
- [ ] **Track selection at submission:**
  - **Particle Universal Accounts Track** (primary)
  - **Arbitrum "Road to Open House London"** bounty
  - **Magic Labs bonus** (judged independently — call out the Magic integration explicitly in the submission form, don't assume it's inferred)
- [ ] Team/milestone registration completed on the Encode platform (solo is fine).
- [ ] Sanity pass on the deployed URL from a fresh browser + a real phone (375 px): login → tip → dashboard feed.

---

## 4. Pitch deck outline (6 slides)

1. **Problem** — Tipping a creator with crypto is a UX disaster: install a wallet, back up a seed phrase, pick a chain, buy a gas token, maybe bridge. Fans give up before any money moves; creators end up with dust scattered across five chains.
2. **Product** — TipJet: type your email, tap Tip $5, done. The fan pays with whatever they hold; the creator receives one clean currency. Screens: tip page, balance pill, success pop.
3. **The magic moment** — "Settled on Arbitrum ✓" with the Arbiscan receipt, and the reveal: *the fan paid on a different chain; nobody touched a bridge, a gas token, or a chain selector — same address throughout.* Then the social loop: the tip carries a note, the note joins the supporter wall, the wall (plus the goal bar) makes the next tip more likely.
4. **Architecture (three-sponsor stack)** — Magic (email OTP; the EOA is the only signer) → Particle Universal Account (EIP-7702: EOA upgraded in place, same address; unified balance; Universal Liquidity routes the source) → Arbitrum One (native USDC settlement). Include the README's ASCII diagram and the `{v,r,s} → yParity` signing detail as the engineering flex.
5. **Why it wins each rubric** — one row per track: Particle (chain abstraction with zero visible chains; first Magic × 7702 pairing; both sides are UAs) · Arbitrum (consumer-grade product where Arbitrum is the trust anchor, every tip converges to USDC there) · Magic (login *and* cryptographic root of the whole stack). Adoption row gets the incumbents' numbers: TikTok gifts keep ~50%, Twitch Bits ~23–40% buy-side markup, YouTube Super Chat 30%, Patreon ~12–15% all-in vs **TipJet 0% platform fee**; disputed tips cost streamers ~$20 in chargeback fees on top of clawbacks — impossible here by construction; Stripe-dependent platforms exclude creators in Nigeria/India entirely — TipJet needs only an email.
6. **What's next** — on-chain Tip events (a public, composable tipping graph on Arbitrum), fiat on-ramp for no-balance fans, an OBS overlay so tips + notes hit the stream live, recurring memberships, Arbitrum Founder House application.
