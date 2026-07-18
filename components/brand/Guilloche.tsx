/**
 * Engraved-banknote line band (guilloché): interleaved sine waves, the way
 * currency printers deter forgery. Used as section dividers and background
 * film on the landing. Pure SVG — tints via currentColor, defaults to ink.
 */
export default function Guilloche({
  height = 64,
  className,
  opacity = 0.12,
}: {
  height?: number;
  className?: string;
  opacity?: number;
}) {
  const waves = Array.from({ length: 7 }, (_, i) => {
    const phase = (i * Math.PI) / 3.2;
    const amp = 10 + (i % 3) * 5;
    const points = Array.from({ length: 61 }, (_, x) => {
      const px = x * 20;
      const py = 32 + amp * Math.sin(x / 2.4 + phase);
      return `${px},${py.toFixed(1)}`;
    });
    return `M${points.join(" L")}`;
  });
  return (
    <svg
      viewBox="0 0 1200 64"
      preserveAspectRatio="none"
      style={{ height, width: "100%", opacity }}
      aria-hidden
      className={className}
    >
      {waves.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.7"
        />
      ))}
    </svg>
  );
}
