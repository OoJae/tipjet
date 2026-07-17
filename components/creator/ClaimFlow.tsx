"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loginEmail, isLoggedIn, getAddress } from "@/lib/magic";
import {
  fetchCreator,
  claimHandle,
  normalizeHandle,
  isValidHandle,
} from "@/lib/creators";
import ShareCard from "./ShareCard";

type Step = 1 | 2 | 3 | 4;
type Availability = "unknown" | "checking" | "available" | "taken";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function ClaimFlow() {
  const [step, setStep] = useState<Step>(1);
  const [rawHandle, setRawHandle] = useState("");
  const [availability, setAvailability] = useState<Availability>("unknown");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [alreadySignedIn, setAlreadySignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimedHandle, setClaimedHandle] = useState<string | null>(null);

  const handle = normalizeHandle(rawHandle);
  const handleValid = isValidHandle(handle);
  const latestHandle = useRef(handle);
  latestHandle.current = handle;

  useEffect(() => {
    isLoggedIn()
      .then(setAlreadySignedIn)
      .catch(() => {
        /* not signed in */
      });
  }, []);

  const checkAvailability = async () => {
    if (!handleValid) return;
    const h = handle;
    setAvailability("checking");
    try {
      const existing = await fetchCreator(h);
      if (latestHandle.current !== h) return; // user kept typing
      setAvailability(existing ? "taken" : "available");
    } catch {
      if (latestHandle.current === h) setAvailability("unknown");
    }
  };

  const continueFromHandle = async () => {
    if (!handleValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const existing = await fetchCreator(handle);
      if (existing) {
        setAvailability("taken");
        return;
      }
      setAvailability("available");
      setStep(2);
    } catch {
      // Availability is re-checked server-side at claim time (409).
      setStep(2);
    } finally {
      setBusy(false);
    }
  };

  const claim = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    let receivingAddress: string;
    try {
      receivingAddress = alreadySignedIn
        ? await getAddress()
        : await loginEmail(email.trim());
    } catch {
      setError("We couldn't sign you in — please try again.");
      setBusy(false);
      return;
    }

    try {
      const creator = await claimHandle({
        handle,
        displayName: displayName.trim(),
        receivingAddress,
      });
      try {
        localStorage.setItem("tipjet.handle", creator.handle);
      } catch {
        /* private mode — non-fatal */
      }
      setClaimedHandle(creator.handle);
      setStep(4);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong — please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-4 py-10">
        <Link
          href="/"
          className="text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          ← Tip<span className="text-brand">Jet</span>
        </Link>

        {step < 4 && (
          <div className="mt-8 flex gap-1.5" aria-hidden>
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-brand" : "bg-card-border"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1 — handle */}
        {step === 1 && (
          <section className="mt-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Pick your handle
            </h1>
            <p className="mt-2 text-muted">
              This becomes your tip link — the one thing you share everywhere.
            </p>
            <div className="mt-6 flex items-center rounded-xl border border-card-border bg-card px-4 focus-within:border-brand">
              <span className="text-lg font-semibold text-muted">@</span>
              <input
                value={rawHandle}
                onChange={(e) => {
                  setRawHandle(e.target.value);
                  setAvailability("unknown");
                }}
                onBlur={checkAvailability}
                placeholder="yourname"
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="min-h-14 w-full bg-transparent px-2 py-3 text-lg font-semibold outline-none placeholder:font-normal placeholder:text-muted/60"
              />
            </div>
            <p className="mt-2 min-h-5 text-sm">
              {availability === "checking" && (
                <span className="text-muted">Checking @{handle}…</span>
              )}
              {availability === "available" && (
                <span className="font-semibold text-money">
                  @{handle} is available ✓
                </span>
              )}
              {availability === "taken" && (
                <span className="font-semibold text-red-500">
                  @{handle} is taken — try another.
                </span>
              )}
              {availability === "unknown" && rawHandle.length > 0 && !handleValid && (
                <span className="text-muted">
                  2–24 characters: letters, numbers, underscores.
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={continueFromHandle}
              disabled={!handleValid || busy || availability === "taken"}
              className="mt-6 min-h-12 w-full rounded-xl bg-brand py-3 font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-40"
            >
              {busy ? "Checking…" : "Continue"}
            </button>
          </section>
        )}

        {/* Step 2 — display name */}
        {step === 2 && (
          <section className="mt-8">
            <h1 className="text-3xl font-bold tracking-tight">
              What should fans call you?
            </h1>
            <p className="mt-2 text-muted">
              Shown on your tip page, right above the button.
            </p>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              autoFocus
              maxLength={50}
              className="mt-6 min-h-14 w-full rounded-xl border border-card-border bg-card px-4 py-3 text-lg font-semibold outline-none placeholder:font-normal placeholder:text-muted/60 focus:border-brand"
            />
            <button
              type="button"
              onClick={() => {
                if (displayName.trim()) setStep(3);
              }}
              disabled={!displayName.trim()}
              className="mt-6 min-h-12 w-full rounded-xl bg-brand py-3 font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-40"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-3 w-full py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
            >
              ← Back
            </button>
          </section>
        )}

        {/* Step 3 — email sign-in + claim */}
        {step === 3 && (
          <section className="mt-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Where your tips land
            </h1>
            <p className="mt-2 text-muted">
              Sign in with your email and we&apos;ll set up your TipJet
              account. Every tip lands there instantly.
            </p>

            <div className="mt-6 rounded-2xl border border-card-border bg-card p-5">
              <p className="font-semibold">@{handle}</p>
              <p className="text-sm text-muted">{displayName.trim()}</p>
            </div>

            {alreadySignedIn ? (
              <>
                <p className="mt-6 text-sm font-semibold text-money">
                  You&apos;re already signed in ✓
                </p>
                <button
                  type="button"
                  onClick={claim}
                  disabled={busy}
                  className="mt-3 min-h-12 w-full rounded-xl bg-brand py-3 font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-40"
                >
                  {busy ? "Setting up…" : `Claim @${handle}`}
                </button>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (EMAIL_RE.test(email.trim())) claim();
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  autoComplete="email"
                  className="mt-6 min-h-14 w-full rounded-xl border border-card-border bg-card px-4 py-3 text-lg outline-none placeholder:text-muted/60 focus:border-brand"
                />
                <button
                  type="submit"
                  disabled={!EMAIL_RE.test(email.trim()) || busy}
                  className="mt-4 min-h-12 w-full rounded-xl bg-brand py-3 font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-40"
                >
                  {busy ? "Setting up…" : "Continue with email"}
                </button>
              </form>
            )}

            {error && (
              <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>
            )}

            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(2);
              }}
              disabled={busy}
              className="mt-3 w-full py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground disabled:opacity-40"
            >
              ← Back
            </button>
          </section>
        )}

        {/* Step 4 — success */}
        {step === 4 && claimedHandle && (
          <section className="mt-10 animate-pop">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-money/10 text-3xl">
                🎉
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight">
                You&apos;re live!
              </h1>
              <p className="mt-2 text-muted">
                Share your link and start getting tipped in dollars.
              </p>
            </div>
            <div className="mt-8">
              <ShareCard handle={claimedHandle} />
            </div>
            <Link
              href="/dashboard"
              className="mt-4 block min-h-12 w-full rounded-xl bg-brand py-3 text-center font-semibold text-white transition-colors hover:bg-brand-strong"
            >
              Open your dashboard
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
