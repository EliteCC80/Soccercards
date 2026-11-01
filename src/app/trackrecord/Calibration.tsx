import type { CalibrationBucket } from "@/lib/metrics";

export function CalibrationChart({ buckets }: { buckets: CalibrationBucket[] }) {
  const S = 320, P = 36, W = S - P - 10;
  const x = (v: number) => P + v * W, y = (v: number) => S - P - v * W;
  const used = buckets.filter((b) => b.n > 0);
  return (
    <figure>
      <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Betrouwbaarheidsgrafiek: voorspelde kans tegenover werkelijke frequentie" className="w-full max-w-md">
        <rect x={P} y={y(1)} width={W} height={W} fill="white" stroke="#d6d3d1" />
        <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="#a8a29e" strokeDasharray="4 3" />
        {used.map((b) => (
          <g key={b.lo}>
            <line x1={x(b.meanPredicted)} x2={x(b.meanPredicted)} y1={y(b.ciLow)} y2={y(b.ciHigh)} stroke="#0f766e" />
            <circle cx={x(b.meanPredicted)} cy={y(b.observed)} r={Math.min(7, 2 + Math.sqrt(b.n) / 3)} fill="#0f766e" />
          </g>
        ))}
        {[0, 0.5, 1].map((t) => (
          <g key={t} fontSize="10" fill="#57534e">
            <text x={x(t)} y={S - P + 14} textAnchor="middle">{t * 100}%</text>
            <text x={P - 6} y={y(t) + 3} textAnchor="end">{t * 100}%</text>
          </g>
        ))}
        <text x={S / 2} y={S - 4} fontSize="10" textAnchor="middle" fill="#57534e">Voorspelde kans</text>
        <text transform={`rotate(-90 10 ${S / 2})`} x={10} y={S / 2} fontSize="10" textAnchor="middle" fill="#57534e">Werkelijk gebeurd</text>
      </svg>
      <figcaption className="text-sm text-stone-600">Punten op de stippellijn = perfect gekalibreerd. Balk = 95%-interval; grotere punten = meer voorspellingen.</figcaption>
    </figure>
  );
}
