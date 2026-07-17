import QRCode from "qrcode";

// GET /api/qr?data=<urlencoded url>&size=<px>
// Returns an SVG QR code for a TipJet link — used for the creator's
// printable/scannable tip-page code. `data` must be an http(s) URL ≤512 chars;
// `size` is 120–1024 px (default 240).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const data = searchParams.get("data");
  if (!data || data.length > 512 || !data.startsWith("http")) {
    return Response.json(
      { error: "data must be an http(s) URL of at most 512 characters" },
      { status: 400 },
    );
  }

  let size = 240;
  const rawSize = searchParams.get("size");
  if (rawSize !== null) {
    const parsed = Number(rawSize);
    if (!Number.isInteger(parsed) || parsed < 120 || parsed > 1024) {
      return Response.json(
        { error: "size must be an integer between 120 and 1024" },
        { status: 400 },
      );
    }
    size = parsed;
  }

  try {
    const svg = await QRCode.toString(data, {
      type: "svg",
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return Response.json({ error: "could not encode QR code" }, { status: 400 });
  }
}
