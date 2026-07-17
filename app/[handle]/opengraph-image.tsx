import { ImageResponse } from "next/og";
import { getCreator } from "@/lib/store";
import { normalizeHandle } from "@/lib/creators";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TipJet tip page";

const BG = "#0a0a0a";
const VIOLET = "#8b5cf6";
const MUTED = "#a1a1aa";
const MONEY = "#10b981";

function trustRow() {
  // Checkmark drawn as SVG — text glyphs outside the base font 404 in satori.
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{ fontSize: 30, color: MUTED }}>
        Tips land as real dollars · Settled on Arbitrum
      </span>
      <svg width="30" height="30" viewBox="0 0 24 24">
        <path
          d="M4 12.5 L9.5 18 L20 6.5"
          stroke={MONEY}
          strokeWidth="3.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function genericCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: BG,
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(139, 92, 246, 0.22), rgba(10, 10, 10, 0) 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flexGrow: 1,
            gap: 20,
          }}
        >
          <div style={{ display: "flex", fontSize: 120, fontWeight: 700 }}>
            <span style={{ color: "#ffffff" }}>Tip</span>
            <span style={{ color: VIOLET }}>Jet</span>
          </div>
          <span style={{ fontSize: 44, color: "#e4e4e7" }}>
            Tip anyone, instantly.
          </span>
        </div>
        {trustRow()}
      </div>
    ),
    { ...size },
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle: raw } = await params;

  try {
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      // keep the raw segment if it is not valid percent-encoding
    }
    const handle = normalizeHandle(decoded);
    const creator = await getCreator(handle);
    if (!creator) return genericCard();

    const displayName = creator.displayName.trim() || creator.handle;
    const initial = (displayName[0] ?? "T").toUpperCase();

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 72,
            backgroundColor: BG,
            backgroundImage:
              "radial-gradient(circle at 20% 0%, rgba(139, 92, 246, 0.22), rgba(10, 10, 10, 0) 60%)",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
              gap: 56,
            }}
          >
            <div
              style={{
                width: 216,
                height: 216,
                borderRadius: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundImage:
                  "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 45%, #6d28d9 100%)",
                color: "#ffffff",
                fontSize: 108,
                fontWeight: 700,
              }}
            >
              {initial}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <span
                style={{ fontSize: 72, fontWeight: 700, color: "#ffffff" }}
              >
                Tip {displayName}
              </span>
              <span style={{ fontSize: 34, color: MUTED }}>
                @{creator.handle} · TipJet
              </span>
            </div>
          </div>
          {trustRow()}
        </div>
      ),
      { ...size },
    );
  } catch {
    return genericCard();
  }
}
