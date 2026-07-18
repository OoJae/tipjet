"use client";

import { useState } from "react";
import { loginEmail } from "@/lib/magic";

export default function LoginButton({
  onLoggedIn,
}: {
  onLoggedIn: (eoa: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = !busy && email.includes("@") && email.includes(".");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const eoa = await loginEmail(email.trim());
      onLoggedIn(eoa);
    } catch {
      setError("We couldn't log you in just now — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-3xl border border-card-border bg-card p-6"
    >
      <label htmlFor="tip-email" className="text-sm font-medium">
        Your email
      </label>
      <input
        id="tip-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        disabled={busy}
        className="rounded-xl border border-card-border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-brand disabled:opacity-40"
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-press rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-strong disabled:opacity-40"
      >
        {busy ? "Check your inbox…" : "Continue with email"}
      </button>
      {error && <p className="text-center text-sm text-red-500">{error}</p>}
      <p className="text-center text-xs text-muted">
        No app to install. No password to remember.
      </p>
    </form>
  );
}
