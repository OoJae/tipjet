import Link from "next/link";
import ExperienceGate from "@/components/landing/ExperienceGate";

const STEPS = [
  {
    title: "Claim your link",
    body: "Pick your handle and sign in with just your email. Ten seconds, tops.",
  },
  {
    title: "Share it anywhere",
    body: "Drop it in your bio, your stream, your posts — anywhere fans can tap.",
  },
  {
    title: "Tips land instantly",
    body: "Real dollars in your balance the moment a fan taps. No forms, no waiting.",
  },
];

export default function Landing() {
  return (
    <>
    <ExperienceGate />
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Soft violet glow behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-brand/15 via-brand/5 to-transparent"
      />

      <div className="relative mx-auto max-w-md px-4 pb-16 pt-10">
        {/* Wordmark */}
        <header className="flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            Tip<span className="text-brand">Jet</span>
          </span>
          <Link
            href="/dashboard"
            className="rounded-full px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
        </header>

        {/* Hero */}
        <section className="mt-14">
          <h1 className="text-5xl font-bold leading-[1.08] tracking-tight">
            Get tipped in{" "}
            <span className="bg-gradient-to-r from-brand to-brand-strong bg-clip-text text-transparent">
              dollars
            </span>
            . From anyone. Instantly.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Your fans tip with one tap. You get real dollars — no forms, no
            fees to think about, no crypto homework.
          </p>
          <Link
            href="/claim"
            className="mt-8 block w-full rounded-full bg-brand py-4 text-center text-lg font-semibold text-white shadow-lg shadow-brand/25 transition-colors hover:bg-brand-strong"
          >
            Claim your link
          </Link>
          <p className="mt-4 text-center text-sm text-muted">
            Free to start. Your first tip could land today.
          </p>
        </section>

        {/* How it works */}
        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            How it works
          </h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex items-start gap-4 rounded-2xl border border-card-border bg-card p-5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-card-border pt-6 text-center text-xs text-muted">
          Built on Magic · Particle Universal Accounts · Arbitrum
        </footer>
      </div>
    </main>
    </>
  );
}
