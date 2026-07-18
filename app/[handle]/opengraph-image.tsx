import { ImageResponse } from "next/og";
import { getCreator } from "@/lib/store";
import { normalizeHandle } from "@/lib/creators";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TipJet tip page";

const PAPER = "#F7F5F0";
const INK = "#14120E";
const VIOLET = "#7C3AED";
const MONEY = "#0E9F6E";
const MUTED = "rgba(20, 18, 14, 0.6)";

const CARD_STYLE = {
  position: "relative" as const,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  padding: 72,
  backgroundColor: PAPER,
  backgroundImage:
    "radial-gradient(circle at 82% 8%, rgba(124, 58, 237, 0.08), rgba(247, 245, 240, 0) 55%)",
  fontFamily: "sans-serif",
};

/**
 * The folded-bill dart — exact PlaneMark facet geometry, scaled via viewBox.
 * Drawn as SVG polygons: text glyphs outside the base font 404 in satori.
 */
function dart(px: number, top: number, right: number) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      style={{ position: "absolute", top, right }}
    >
      <polygon points="59,12 29,34 24,51" fill="#0A7C55" />
      <polygon points="59,12 29,34 38,47" fill={VIOLET} />
      <polygon points="59,12 5,27 29,34" fill={MONEY} />
      <line
        x1="59"
        y1="12"
        x2="29"
        y2="34"
        stroke="rgba(20, 18, 14, 0.25)"
        strokeWidth="1"
      />
    </svg>
  );
}

function trustRow() {
  // Checkmark drawn as SVG — text glyphs outside the base font 404 in satori.
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{ fontSize: 30, color: MUTED }}>
        Real dollars · Settled on Arbitrum
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
      <div style={CARD_STYLE}>
        {dart(280, 44, 64)}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flexGrow: 1,
            gap: 20,
          }}
        >
          <div style={{ display: "flex", fontSize: 110, fontWeight: 700 }}>
            <span style={{ color: INK }}>Tip</span>
            <span style={{ color: VIOLET }}>Jet</span>
          </div>
          <span style={{ fontSize: 44, color: "rgba(20, 18, 14, 0.78)" }}>
            Tips that fly to you.
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
        <div style={CARD_STYLE}>
          {dart(220, 40, 64)}
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
                backgroundColor: VIOLET,
                color: "#ffffff",
                fontSize: 108,
                fontWeight: 700,
              }}
            >
              {initial}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <span style={{ fontSize: 72, fontWeight: 700, color: INK }}>
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
