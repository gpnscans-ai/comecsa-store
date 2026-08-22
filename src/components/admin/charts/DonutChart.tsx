type Slice = { label: string; value: number; color: string };

export default function DonutChart({ data, title }: { data: Slice[]; title?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 160;
  const r = 60;
  const stroke = 26;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const fraction = total > 0 ? d.value / total : 0;
      const dash = fraction * circumference;
      const gap = circumference - dash;
      const rotation = (offset / total) * 360 - 90;
      offset += d.value;
      return { ...d, dash, gap, rotation, pct: total > 0 ? Math.round(fraction * 100) : 0 };
    });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff1a" strokeWidth={stroke} />
        ) : (
          arcs.map((a) => (
            <circle
              key={a.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={`${a.dash} ${a.gap}`}
              transform={`rotate(${a.rotation} ${cx} ${cy})`}
              strokeLinecap="butt"
            >
              <title>{`${a.label}: ${a.value} (${a.pct}%)`}</title>
            </circle>
          ))
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-white text-xl font-bold" style={{ fontSize: 22, fontWeight: 700 }}>
          {total}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontSize: 10, fill: "#ffffff66" }}>
          {title || "total"}
        </text>
      </svg>
      <div className="flex flex-1 flex-col gap-1.5 text-sm">
        {total === 0 && <p className="text-white/40">Sin datos todavía.</p>}
        {arcs.map((a) => (
          <div key={a.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-white/70">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: a.color }} />
              {a.label}
            </span>
            <span className="font-semibold text-white/90">
              {a.value} <span className="font-normal text-white/40">({a.pct}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
