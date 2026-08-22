type Series = { label: string; color: string; values: number[] };

// Parte una etiqueta larga en hasta 2 líneas horizontales (sin inclinarla).
function wrapLabel(text: string, maxCharsPerLine = 13, maxLines = 2) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
    if (lines.length === maxLines - 1 && current.length > maxCharsPerLine) {
      current = `${current.slice(0, maxCharsPerLine - 1)}…`;
      break;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

export default function BarChart({
  categories,
  series,
  formatValue = (v: number) => String(v),
}: {
  categories: string[];
  series: Series[];
  formatValue?: (v: number) => string;
}) {
  const width = 560;
  const height = 240;
  const padding = { top: 16, right: 8, bottom: 56, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const groupW = chartW / categories.length;
  const barGap = 4;
  const barW = Math.max(6, (groupW - barGap * (series.length + 1)) / series.length);

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
        {categories.map((cat, i) => {
          const groupX = padding.left + i * groupW;
          return (
            <g key={cat}>
              {series.map((s, si) => {
                const value = s.values[i] ?? 0;
                const barH = max > 0 ? (value / max) * chartH : 0;
                const x = groupX + barGap + si * (barW + barGap);
                const y = height - padding.bottom - barH;
                return (
                  <rect key={s.label} x={x} y={y} width={barW} height={Math.max(barH, value > 0 ? 2 : 0)} rx={3} fill={s.color}>
                    <title>{`${cat} · ${s.label}: ${formatValue(value)}`}</title>
                  </rect>
                );
              })}
              <text
                x={groupX + groupW / 2}
                y={height - padding.bottom + 14}
                textAnchor="middle"
                style={{ fontSize: 10, fill: "#ffffff99" }}
              >
                <title>{cat}</title>
                {wrapLabel(cat).map((line, li) => (
                  <tspan key={li} x={groupX + groupW / 2} dy={li === 0 ? 0 : 12}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
