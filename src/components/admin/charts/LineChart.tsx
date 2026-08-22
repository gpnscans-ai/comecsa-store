type Series = { label: string; color: string; values: number[] };

export default function LineChart({
  categories,
  series,
  formatValue = (v: number) => String(v),
}: {
  categories: string[];
  series: Series[];
  formatValue?: (v: number) => string;
}) {
  const width = 560;
  const height = 220;
  const padding = { top: 16, right: 12, bottom: 28, left: 12 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const stepX = categories.length > 1 ? chartW / (categories.length - 1) : 0;

  const pointsFor = (values: number[]) =>
    values.map((v, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + chartH - (v / max) * chartH,
    }));

  // Curva suave (Catmull-Rom convertido a Bézier cúbico).
  function smoothPath(points: { x: number; y: number }[]) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-white/60">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#ffffff1f" strokeWidth={1} />
        {series.map((s) => {
          const points = pointsFor(s.values);
          const linePath = smoothPath(points);
          const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
          const gradientId = `line-gradient-${s.label.replace(/\s+/g, "-")}`;
          return (
            <g key={s.label}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={areaPath} fill={`url(#${gradientId})`} />
              <path d={linePath} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={s.color} stroke="#101018" strokeWidth={1.5}>
                  <title>{`${categories[i]} · ${s.label}: ${formatValue(s.values[i] ?? 0)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
        {categories.map((cat, i) => (
          <text
            key={cat}
            x={padding.left + i * stepX}
            y={height - padding.bottom + 16}
            textAnchor="middle"
            style={{ fontSize: 10, fill: "#ffffff66" }}
          >
            {cat}
          </text>
        ))}
      </svg>
    </div>
  );
}
