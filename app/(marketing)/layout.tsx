import { Fraunces } from "next/font/google";

// Display face: a banknote serif with a wink (variable optical size + WONK).
// Imported ONLY in this route group so the font payload/preload never touches
// the product routes (/[handle], /dashboard, /claim).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${fraunces.variable} landing-root`}>{children}</div>;
}
