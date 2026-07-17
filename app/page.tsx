"use client";

import dynamic from "next/dynamic";

// Load the smoke test client-side only — Magic + Universal Account SDKs touch
// browser globals and must never run during SSR/prerender.
const SmokeTest = dynamic(() => import("@/components/SmokeTest"), { ssr: false });

export default function Home() {
  return <SmokeTest />;
}
