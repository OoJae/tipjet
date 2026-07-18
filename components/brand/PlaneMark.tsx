/**
 * The TipJet mark: a dollar bill folded into a paper dart.
 *
 * Three facets — sunlit wing (bill green), shadow wing (deep green), and the
 * keel fold (brand violet): the "tip" made of money-paper, mid-flight, banking
 * right. Reads crisply at 16px; `detailed` adds engraved guilloché lines for
 * hero/large uses.
 */
export default function PlaneMark({
  size = 28,
  detailed = false,
  className,
  title = "TipJet",
}: {
  size?: number;
  detailed?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
    >
      {/* shadow wing (far side) */}
      <polygon points="59,12 29,34 24,51" fill="#0A7C55" />
      {/* keel — the violet fold */}
      <polygon points="59,12 29,34 38,47" fill="#7C3AED" />
      {/* sunlit wing (near side) */}
      <polygon points="59,12 5,27 29,34" fill="#0E9F6E" />
      {detailed && (
        <g stroke="#F7F5F0" strokeWidth="0.9" fill="none" opacity="0.5">
          <path d="M52 15 Q 30 19 12 26" />
          <path d="M50 17.5 Q 32 21.5 18 26.5" />
          <path d="M47 20 Q 34 24 24 28.5" />
        </g>
      )}
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
    </svg>
  );
}
