// Fraunces now loads at the root layout (the paper identity spans the whole
// product); this group only scopes the landing-root token world.
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="landing-root">{children}</div>;
}
