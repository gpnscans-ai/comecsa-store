type Bar = { label: string; value: number; color: string };

export default function HorizontalBarChart({
  bars,
  formatValue = (v: number) => String(v),
}: {
  bars: Bar[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="space-y-2.5">
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-white/60" title={b.label}>{b.label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-white/5">
            <div
              className="h-full rounded transition-all"
              style={{ width: `${(b.value / max) * 100}%`, background: b.color, minWidth: b.value > 0 ? 8 : 0 }}
              title={`${b.label}: ${formatValue(b.value)}`}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-sm font-semibold text-white/90">{formatValue(b.value)}</span>
        </div>
      ))}
      {bars.every((b) => b.value === 0) && <p className="text-sm text-white/40">Sin ventas asignadas este mes.</p>}
    </div>
  );
}
