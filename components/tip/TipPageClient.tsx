"use client";

import dynamic from "next/dynamic";

// The real tip page touches Magic + Universal Account SDKs (browser globals),
// so it must never render during SSR/prerender.
const TipPage = dynamic(() => import("@/components/tip/TipPage"), {
  ssr: false,
  loading: () => (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4">
      <p className="animate-pulse text-muted">Loading…</p>
    </main>
  ),
});

export default function TipPageClient({ handle }: { handle: string }) {
  return <TipPage handle={handle} />;
}
