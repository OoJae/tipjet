import PlaneMark from "./PlaneMark";

/**
 * TipJet wordmark: the folded-bill dart + "TipJet" in the display serif.
 * "Tip" in ink, "Jet" in the brand violet — the fold carried into the type.
 * Requires --font-fraunces (marketing layout) or falls back to the site serif.
 */
export default function Wordmark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <PlaneMark size={size} />
      <span
        className="font-display font-semibold"
        style={{ fontSize: size * 0.86, lineHeight: 1 }}
      >
        <span style={{ color: "var(--ink, currentColor)" }}>Tip</span>
        <span style={{ color: "var(--brand)" }}>Jet</span>
      </span>
    </span>
  );
}
