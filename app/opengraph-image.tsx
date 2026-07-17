import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TipJet — get tipped in dollars";

export default async function Image() {
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
          backgroundColor: "#0a0a0a",
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
            <span style={{ color: "#8b5cf6" }}>Jet</span>
          </div>
          <span style={{ fontSize: 44, color: "#e4e4e7" }}>
            Get tipped in dollars. From anyone. Instantly.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontSize: 30, color: "#a1a1aa" }}>
            Tips land as real dollars · Settled on Arbitrum
          </span>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#10b981" }}>
            ✓
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
