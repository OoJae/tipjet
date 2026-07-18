// CSS-only enter transition, scoped to the marketing group — product routes
// (/[handle], /dashboard, /claim) are outside this group and never remount.
export default function MarketingTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="marketing-enter">{children}</div>;
}
