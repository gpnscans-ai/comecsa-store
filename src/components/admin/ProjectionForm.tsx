"use client";

import { useState } from "react";
import { saveProjection } from "@/app/admin/finanzas/proyeccion/actions";
import type { ProjectionYear } from "@/lib/financialEvaluation";

const ROWS: { key: keyof ProjectionYear; label: string }[] = [
  { key: "revenue", label: "(+) Ingresos" },
  { key: "variable_costs", label: "(−) Costos variables" },
  { key: "fixed_costs", label: "(−) Costos fijos operativos" },
  { key: "amortization", label: "(−) Amortización gastos de constitución" },
  { key: "depreciation", label: "(−) Depreciación" },
  { key: "loan_interest", label: "(−) Intereses del préstamo" },
  { key: "loan_payment", label: "(−) Abono a capital del préstamo (solo flujo de caja)" },
  { key: "salvage_value", label: "(+) Valor de salvamento (normalmente solo Año 5)" },
];

export default function ProjectionForm({
  initialInvestment,
  discountRatePct,
  profitSharingPct,
  incomeTaxPct,
  years,
}: {
  initialInvestment: number;
  discountRatePct: number;
  profitSharingPct: number;
  incomeTaxPct: number;
  years: ProjectionYear[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    const result = await saveProjection(formData);
    if (result?.error) setError(result.error);
    else setSaved(true);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Inversión inicial (aporte de socios)</label>
          <input
            className="input"
            name="initial_investment"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={initialInvestment || ""}
          />
        </div>
        <div>
          <label className="label">Tasa de descuento (%)</label>
          <input
            className="input"
            name="discount_rate_pct"
            type="number"
            step="0.01"
            min="0.01"
            max="99"
            required
            defaultValue={discountRatePct || 10}
          />
        </div>
        <div>
          <label className="label">Participación trabajadores (%)</label>
          <input
            className="input"
            name="profit_sharing_pct"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={profitSharingPct || 15}
          />
        </div>
        <div>
          <label className="label">Impuesto a la renta (%)</label>
          <input
            className="input"
            name="income_tax_pct"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={incomeTaxPct || 25}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-3 py-2">Concepto</th>
              {[1, 2, 3, 4, 5].map((y) => (
                <th key={y} className="px-3 py-2 text-right">Año {y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key} className="border-b border-ink-100">
                <td className="px-3 py-2 text-ink-700/70">{row.label}</td>
                {[0, 1, 2, 3, 4].map((idx) => (
                  <td key={idx} className="px-2 py-1.5">
                    <input
                      className="input text-right"
                      name={`${row.key}_${idx + 1}`}
                      type="number"
                      step="0.01"
                      defaultValue={years[idx]?.[row.key] || ""}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-700/50">
        La Participación a Trabajadores y el Impuesto a la Renta se calculan automáticamente sobre la utilidad de
        cada año con los porcentajes de arriba — no los ingreses aquí.
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && !error && <p className="text-sm text-emerald-600">Proyección guardada.</p>}

      <button type="submit" className="btn-primary">Guardar y recalcular</button>
    </form>
  );
}
