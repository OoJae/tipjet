import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

// Display serif (banknote-with-a-wink) — brand voice on every route now that
// the paper identity spans the whole product. display:swap + metric fallback
// keeps CLS ~0; one subset woff2.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tipjet-chi.vercel.app"),
  title: "TipJet — tip anyone, instantly",
  description:
    "Tip your favorite creators with one tap. No wallet setup, no seed phrases, no crypto homework. Creators get real dollars, instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
