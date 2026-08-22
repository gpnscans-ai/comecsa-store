type Stage = { label: string; value: number; color: string };

export default function PipelineChart({
  stages,
  formatValue = (v: number) => String(v),
  emptyLabel = "Sin pedidos todavía.",
}: {
  stages: Stage[];
  formatValue?: (v: number) => string;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="space-y-2.5">
      {stages.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-white/60" title={s.label}>{s.label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-white/5">
            <div
              className="h-full rounded transition-all"
              style={{ width: `${(s.value / max) * 100}%`, background: s.color, minWidth: s.value > 0 ? 8 : 0 }}
              title={`${s.label}: ${formatValue(s.value)}`}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-sm font-semibold text-white/80">{formatValue(s.value)}</span>
        </div>
      ))}
      {stages.every((s) => s.value === 0) && <p className="text-sm text-white/40">{emptyLabel}</p>}
    </div>
  );
}
