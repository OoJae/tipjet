import type { Metadata } from "next";
import Link from "next/link";
import ExperienceGate from "@/components/landing/ExperienceGate";
import StaticHero from "@/components/landing/StaticHero";
import MagneticCTA from "@/components/landing/ui/MagneticCTA";
import PlaneMark from "@/components/brand/PlaneMark";
import Wordmark from "@/components/brand/Wordmark";
import Guilloche from "@/components/brand/Guilloche";

export const metadata: Metadata = {
  title: "TipJet — Tips that fly to you",
  description:
    "Your fans tip with one tap. You get real dollars — anywhere on earth.",
};

/* Shared class recipes (no new CSS — globals.css is frozen). --ink (#14120E)
   is a plain CSS var, not a Tailwind token, so translucent ink uses the hex. */
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5F0]";
const QUIET_LINK = `rounded-full px-3 py-2 text-sm font-semibold text-[#14120E]/60 transition-colors hover:text-[#14120E] ${FOCUS_RING}`;
const EYEBROW =
  "sec-eyebrow font-mono text-xs uppercase tracking-[0.08em] text-[#14120E]/50";
const SEC_H =
  "sec-h font-display mt-4 max-w-2xl text-[clamp(2rem,4.5vw,4.25rem)] leading-[1.05] tracking-[-0.02em]";

const AMOUNTS = ["$1", "$5", "$10"];

const NOTES = [
  {
    name: "Jide",
    amount: "$5.00",
    note: "Your videos got me through finals ❤️",
    tilt: "-rotate-2",
    lift: "",
  },
  {
    name: "Ade",
    amount: "$0.50",
    note: "Love what you do — keep going! 🙌",
    tilt: "rotate-1",
    lift: "sm:mt-10",
  },
  {
    name: "Maya",
    amount: "$10.00",
    note: "For the best tutorial on the internet.",
    tilt: "rotate-[3deg]",
    lift: "sm:mt-4",
  },
];

const CHAINS: Array<[string, string]> = [
  ["BASE", "-rotate-2"],
  ["ETHEREUM", "rotate-1"],
  ["SOLANA", "-rotate-1"],
  ["BNB CHAIN", "rotate-2"],
  ["X LAYER", "-rotate-2"],
];

export default function Landing() {
  return (
    <>
      {/* 3D flight layer — mounts behind the content (z-[1]) when the device passes the gate */}
      <ExperienceGate />

      {/* Content layer — real HTML above the canvas; the flight path avoids text zones */}
      <div className="relative z-[2]">
        <a
          href="#main"
          className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white ${FOCUS_RING}`}
        >
          Skip to content
        </a>

        {/* z-10: #hero is a later positioned sibling — without a z-index the
            hero's transparent padding hit-tests ABOVE this header and eats
            every click on the nav buttons. */}
        <header className="absolute inset-x-0 top-0 z-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <Wordmark />
            <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-4">
              <Link href="/dashboard" className={QUIET_LINK}>
                Dashboard
              </Link>
              <Link
                href="/claim"
                className={`btn-press rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white ${FOCUS_RING}`}
              >
                Claim your link
              </Link>
            </nav>
          </div>
        </header>

        <main id="main">
          <div id="landing-story">
            {/* ── HERO ─────────────────────────────────────────────── */}
            <section
              id="hero"
              className="relative flex min-h-screen items-center px-6 pb-28 pt-28 md:pt-32"
            >
              <div className="relative mx-auto w-full max-w-6xl">
                {/* Hero art: in-flow above the h1 on mobile, upper right on md+ */}
                <StaticHero className="pointer-events-none mb-10 w-[250px] max-w-[70vw] md:absolute md:-top-24 md:right-0 md:mb-0 md:w-[40vw] md:max-w-[520px]" />

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-7">
                    <h1 className="font-display text-[clamp(3rem,9vw,8.5rem)] leading-[0.95] tracking-[-0.02em]">
                      <span className="line-mask block overflow-hidden">
                        <span className="line block">Tips that</span>
                      </span>
                      <span className="line-mask block overflow-hidden">
                        <span className="line block">fly to you.</span>
                      </span>
                      <span className="line-mask block overflow-hidden">
                        <span className="line flex flex-wrap items-center gap-2 pt-5 sm:gap-3">
                          {AMOUNTS.map((amount) => (
                            <span
                              key={amount}
                              className="inline-flex items-center rounded-full border border-card-border bg-white/70 px-4 py-1.5 font-mono text-sm font-medium tracking-normal shadow-sm sm:text-base"
                              style={{ color: "var(--money-print)" }}
                            >
                              {amount}
                            </span>
                          ))}
                        </span>
                      </span>
                    </h1>

                    <p className="hero-sub mt-8 max-w-md text-lg leading-relaxed text-[#14120E]/70">
                      Your fans tip with one tap. You get real dollars —
                      anywhere on earth.
                    </p>

                    <div className="hero-cta mt-10 flex flex-wrap items-center gap-4">
                      <Link
                        href="/claim"
                        className={`btn-press rounded-full bg-brand px-7 py-4 font-semibold text-white ${FOCUS_RING}`}
                      >
                        Claim your link
                      </Link>
                      <Link
                        href="/alex"
                        className={`rounded-full px-4 py-4 font-semibold text-[#14120E]/60 transition-colors hover:text-[#14120E] ${FOCUS_RING}`}
                      >
                        See a live tip page
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 font-mono text-xs uppercase tracking-[0.08em] text-[#14120E]/40"
              >
                <span>SCROLL — WATCH A TIP FLY</span>
                <span className="text-base leading-none">⌄</span>
              </div>
            </section>

            {/* ── 01 WRITE ─────────────────────────────────────────── */}
            <section id="write" className="flex min-h-screen items-center px-6 py-24">
              <div className="mx-auto w-full max-w-6xl">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-5">
                    <p className={EYEBROW}>01 — WRITE</p>
                    <h2 className={SEC_H}>Every tip is a note.</h2>
                  </div>
                  <div className="col-span-12 mt-8 md:col-span-7 md:col-start-6 md:mt-10">
                    <div className="grid gap-6 sm:grid-cols-3">
                      {NOTES.map(({ name, amount, note, tilt, lift }) => (
                        <figure
                          key={name}
                          className={`note-card ${tilt} ${lift} rounded-xl border border-[#14120E]/10 bg-white/70 p-5 shadow-sm`}
                        >
                          <figcaption className="flex items-baseline justify-between gap-3">
                            <span className="font-semibold">{name}</span>
                            <span
                              className="font-mono text-sm"
                              style={{ color: "var(--money-print)" }}
                            >
                              {amount}
                            </span>
                          </figcaption>
                          <blockquote className="mt-3 text-[15px] italic leading-relaxed text-[#14120E]/80">
                            {note}
                          </blockquote>
                        </figure>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 02 SEND ──────────────────────────────────────────── */}
            <section id="send" className="flex min-h-screen items-center px-6 py-24">
              <div className="mx-auto w-full max-w-6xl">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-8 md:col-start-2">
                    <p className={EYEBROW}>02 — SEND</p>
                    <h2 className={SEC_H}>One tap. That&apos;s the whole thing.</h2>

                    <div
                      aria-hidden
                      className="send-bill relative mt-12 w-full max-w-md overflow-hidden rounded-2xl border-4 border-double border-[#14120E]/20 bg-[#F7F5F0] px-10 py-14 shadow-sm"
                    >
                      <div className="absolute inset-x-0 top-1">
                        <Guilloche height={44} opacity={0.1} />
                      </div>
                      <div className="absolute inset-x-0 bottom-1">
                        <Guilloche height={44} opacity={0.1} />
                      </div>
                      <span className="absolute left-4 top-3 font-mono text-xs uppercase tracking-[0.08em] text-[#14120E]/50">
                        TIP
                      </span>
                      <span className="absolute bottom-3 right-4 font-mono text-xs uppercase tracking-[0.08em] text-[#14120E]/50">
                        TIP
                      </span>
                      <div className="relative flex items-center justify-center gap-8">
                        <span
                          className="font-display text-[7rem] leading-none"
                          style={{ color: "var(--money-print)" }}
                        >
                          $5
                        </span>
                        <PlaneMark size={44} detailed />
                      </div>
                    </div>

                    <p className="send-sub mt-8 max-w-md text-lg leading-relaxed text-[#14120E]/70">
                      A fan types their email and taps. No app, no password, no
                      wallet homework.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 03 FLY (full-bleed band) ─────────────────────────── */}
            <section id="fly" className="flex min-h-screen flex-col justify-center">
              <Guilloche height={96} />
              <div className="mx-auto w-full max-w-6xl px-6 py-16">
                <p className={EYEBROW}>03 — FLY</p>
                <h2 className={SEC_H}>It crosses chains so nobody has to.</h2>

                <div className="mt-12 flex flex-wrap items-center gap-3 sm:gap-4">
                  {CHAINS.map(([chain, tilt]) => (
                    <span
                      key={chain}
                      className={`chain-stamp ${tilt} rounded border-2 border-[#14120E]/25 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-[#14120E]/70`}
                    >
                      {chain}
                    </span>
                  ))}
                  <span aria-hidden className="px-1 text-xl text-[#14120E]/40">
                    →
                  </span>
                  <span className="chain-dest rotate-1 rounded border-2 border-brand px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-brand">
                    ARBITRUM
                  </span>
                </div>

                <p className="fly-sub mt-10 max-w-md text-lg leading-relaxed text-[#14120E]/70">
                  Money routes itself from wherever fans hold it. No bridges, no
                  swapping, no forms. It just flies.
                </p>
              </div>
              <Guilloche height={96} />
            </section>

            {/* ── 04 LAND ──────────────────────────────────────────── */}
            <section id="land" className="flex min-h-screen items-center px-6 py-24">
              <div className="mx-auto w-full max-w-6xl">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-6 md:col-start-7">
                    <p className={EYEBROW}>04 — LAND</p>
                    <h2 className={SEC_H}>Settled. For real.</h2>

                    <div className="receipt mt-10 w-full max-w-sm divide-y divide-dashed divide-[#14120E]/15 rounded-lg border border-[#14120E]/10 bg-white px-6 py-3 font-mono text-sm shadow-sm">
                      <p className="receipt-line flex justify-between gap-4 py-3">
                        <span>TIP</span>
                        <span>#0001</span>
                      </p>
                      <p className="receipt-line flex justify-between gap-4 py-3">
                        <span>FROM</span>
                        <span>a fan · TO @you</span>
                      </p>
                      <p className="receipt-line flex justify-between gap-4 py-3">
                        <span>AMOUNT</span>
                        <span>$5.00</span>
                      </p>
                      <p
                        className="receipt-line flex justify-between gap-4 py-3 font-bold"
                        style={{ color: "var(--money-print)" }}
                      >
                        <span>SETTLED ON ARBITRUM</span>
                        <span>✓</span>
                      </p>
                    </div>

                    <a
                      href="https://arbiscan.io/tx/0xa9f61dda499dba73374f4fd8f17b3bbf6a47f8e779b5f4c181293cd2e9371956"
                      target="_blank"
                      rel="noopener"
                      className={`receipt-proof mt-5 inline-block rounded font-mono text-xs text-[#14120E]/60 underline underline-offset-4 transition-colors hover:text-[#14120E] ${FOCUS_RING}`}
                    >
                      see a real settlement ↗
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────── */}
            <section
              id="cta"
              className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-24 text-center"
            >
              <h2 className="cta-h font-display mx-auto max-w-3xl text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] tracking-[-0.02em]">
                Your fans are holding tips for you. Give them somewhere to land.
              </h2>
              <div className="mt-10">
                <MagneticCTA href="/claim" label="Claim your link" />
              </div>
              <p className="cta-small mt-8 font-mono text-xs uppercase tracking-[0.08em] text-[#14120E]/50">
                FREE · NO PLATFORM FEES · WORKS ANYWHERE EMAIL WORKS
              </p>
            </section>
          </div>
        </main>

        <footer className="border-t border-[#14120E]/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-10">
            <div className="flex flex-col gap-3">
              <Wordmark size={22} />
              <p className="font-mono text-xs text-[#14120E]/45">
                Built on Magic · Particle Universal Accounts · Arbitrum
              </p>
            </div>
            <nav aria-label="Footer" className="flex items-center gap-2 sm:gap-4">
              <a
                href="https://github.com/OoJae/tipjet"
                target="_blank"
                rel="noopener"
                className={QUIET_LINK}
              >
                GitHub
              </a>
              <Link href="/alex" className={QUIET_LINK}>
                Live tip page
              </Link>
            </nav>
          </div>
        </footer>
      </div>

      {/* Paper grain film over everything */}
      <div aria-hidden className="paper-grain pointer-events-none fixed inset-0 z-[3]" />
    </>
  );
}
