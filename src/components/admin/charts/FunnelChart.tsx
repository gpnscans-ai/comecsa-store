type Stage = { label: string; value: number; color: string };

export default function FunnelChart({
  stages,
  formatValue = (v: number) => String(v),
}: {
  stages: Stage[];
  formatValue?: (v: number) => string;
}) {
  const width = 560;
  const rowH = 44;
  const gap = 3;
  const height = stages.length * (rowH + gap);
  const maxW = width * 0.86;
  const minW = width * 0.16;
  const max = Math.max(1, ...stages.map((s) => s.value));

  const widthFor = (v: number) => minW + (maxW - minW) * (v / max);

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {stages.map((s, i) => {
          const topW = widthFor(s.value);
          const nextV = stages[i + 1]?.value ?? s.value;
          const botW = widthFor(i === stages.length - 1 ? s.value : nextV);
          const y0 = i * (rowH + gap);
          const y1 = y0 + rowH;
          const cx = width / 2;
          const points = [
            [cx - topW / 2, y0],
            [cx + topW / 2, y0],
            [cx + botW / 2, y1],
            [cx - botW / 2, y1],
          ]
            .map((p) => p.join(","))
            .join(" ");

          return (
            <g key={s.label}>
              <polygon points={points} fill={s.color} opacity={0.9}>
                <title>{`${s.label}: ${formatValue(s.value)}`}</title>
              </polygon>
              <text
                x={cx}
                y={y0 + rowH / 2 + 4}
                textAnchor="middle"
                style={{ fontSize: 12, fontWeight: 600, fill: "#ffffff" }}
              >
                {s.label} · {formatValue(s.value)}
              </text>
            </g>
          );
        })}
      </svg>
      {stages.every((s) => s.value === 0) && <p className="text-sm text-white/40">Sin pedidos todavía.</p>}
    </div>
  );
}
