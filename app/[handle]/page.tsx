import TipPageClient from "@/components/tip/TipPageClient";

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
