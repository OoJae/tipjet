import type { Metadata } from "next";
import TipPageClient from "@/components/tip/TipPageClient";
import { getCreator } from "@/lib/store";
import { normalizeHandle } from "@/lib/creators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle: raw } = await params;
  try {
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      // keep the raw segment if it is not valid percent-encoding
    }
    const creator = await getCreator(normalizeHandle(decoded));
    if (creator) {
      return {
        title: `Tip ${creator.displayName} (@${creator.handle}) · TipJet`,
        description: `Leave ${creator.displayName} a tip — it lands as real dollars, instantly.`,
      };
    }
  } catch {
    // registry unavailable — fall through to the generic title
  }
  return { title: "TipJet" };
}

// Next 15 App Router: params are async. This server component only unwraps the
// handle and hands off to a client-only wrapper (Magic + UA never run on the server).
export default async function Page({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return <TipPageClient handle={handle} />;
}
