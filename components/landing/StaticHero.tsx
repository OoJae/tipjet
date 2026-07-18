/**
 * The hero illustration — and the ENTIRE hero visual in static mode.
 *
 * Server-renderable 2D composition of the folded-bill dart (PlaneMark's facet
 * geometry inlined at large size, engraved lines included), trailing a dotted
 * flight path with a loop-the-loop and a few tip-notes fluttering behind it.
 * This inline SVG is the LCP element: zero requests, paints immediately.
 *
 * Deliberately still. Reduced-motion and non-WebGL visitors get exactly this;
 * when the 3D experience mounts, its plane flies the page and this reads as
 * the hero's printed illustration. No animation here by design.
 */
export default function StaticHero({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <svg
        viewBox="0 0 520 400"
        className="h-auto w-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="tj-hero-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#14120E" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#14120E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Dotted flight path — swoops in from lower-left, curls once, meets the tail */}
        <path
          d="M 26 374 C 96 398 160 392 200 352 C 224 328 214 296 190 300 C 166 304 168 336 202 332 C 244 326 262 296 296 262"
          fill="none"
          stroke="#14120E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="0.6 9"
          opacity="0.35"
        />

        {/* Tip-notes fluttering along the path */}
        <g transform="translate(52 330) rotate(-8)">
          <rect
            width="44"
            height="28"
            rx="4"
            fill="#FFFFFF"
            opacity="0.9"
            stroke="#14120E"
            strokeOpacity="0.12"
          />
          <text
            x="7"
            y="19"
            fontSize="11"
            fill="#0E9F6E"
            className="font-mono"
          >
            $1
          </text>
          <line x1="24" y1="12" x2="38" y2="12" stroke="#14120E" opacity="0.15" />
          <line x1="24" y1="18" x2="34" y2="18" stroke="#14120E" opacity="0.15" />
        </g>
        <g transform="translate(136 350) rotate(6)">
          <rect
            width="44"
            height="28"
            rx="4"
            fill="#FFFFFF"
            opacity="0.9"
            stroke="#14120E"
            strokeOpacity="0.12"
          />
          <text
            x="7"
            y="19"
            fontSize="11"
            fill="#0E9F6E"
            className="font-mono"
          >
            $5
          </text>
          <line x1="24" y1="12" x2="38" y2="12" stroke="#14120E" opacity="0.15" />
          <line x1="24" y1="18" x2="34" y2="18" stroke="#14120E" opacity="0.15" />
        </g>
        <g transform="translate(204 288) rotate(-12)">
          <rect
            width="48"
            height="28"
            rx="4"
            fill="#FFFFFF"
            opacity="0.9"
            stroke="#14120E"
            strokeOpacity="0.12"
          />
          <text
            x="7"
            y="19"
            fontSize="11"
            fill="#0E9F6E"
            className="font-mono"
          >
            $10
          </text>
          <line x1="30" y1="12" x2="42" y2="12" stroke="#14120E" opacity="0.15" />
          <line x1="30" y1="18" x2="38" y2="18" stroke="#14120E" opacity="0.15" />
        </g>

        {/* Soft ground shadow — grounds the dart in the frame */}
        <ellipse
          cx="352"
          cy="330"
          rx="96"
          ry="16"
          fill="url(#tj-hero-shadow)"
        />

        {/* The folded-bill dart — PlaneMark facet geometry at hero scale */}
        <g transform="translate(206 34) scale(4.35)">
          {/* shadow wing (far side) */}
          <polygon points="59,12 29,34 24,51" fill="#0A7C55" />
          {/* keel — the violet fold */}
          <polygon points="59,12 29,34 38,47" fill="#7C3AED" />
          {/* sunlit wing (near side) */}
          <polygon points="59,12 5,27 29,34" fill="#0E9F6E" />
          {/* engraved guilloché lines on the sunlit wing */}
          <g stroke="#F7F5F0" strokeWidth="0.9" fill="none" opacity="0.5">
            <path d="M52 15 Q 30 19 12 26" />
            <path d="M50 17.5 Q 32 21.5 18 26.5" />
            <path d="M47 20 Q 34 24 24 28.5" />
          </g>
          {/* crease hairline */}
          <line
            x1="59"
            y1="12"
            x2="29"
            y2="34"
            stroke="#14120E"
            strokeWidth="1"
            opacity="0.25"
          />
        </g>
      </svg>
    </div>
  );
}
