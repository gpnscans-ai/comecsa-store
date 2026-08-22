import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/utils";
import ProjectionForm from "@/components/admin/ProjectionForm";
import BarChart from "@/components/admin/charts/BarChart";
import LineChart from "@/components/admin/charts/LineChart";
import {
  computeIncomeStatement,
  computeCashFlow,
  computeVAN,
  computeTIR,
  computeRBC,
  computePRI,
  priToYearsMonths,
  type ProjectionYear,
  type IncomeStatementYear,
} from "@/lib/financialEvaluation";

export const dynamic = "force-dynamic";

const EMPTY_YEAR: ProjectionYear = {
  revenue: 0,
  variable_costs: 0,
  fixed_costs: 0,
  depreciation: 0,
  amortization: 0,
  loan_interest: 0,
  loan_payment: 0,
  salvage_value: 0,
};

const INCOME_STATEMENT_ROWS: { label: string; key: keyof IncomeStatementYear; bold?: boolean; divider?: boolean }[] = [
  { label: "Ingresos", key: "revenue", bold: true },
  { label: "− Costos variables", key: "variableCosts" },
  { label: "= Margen de contribución", key: "contributionMargin", bold: true, divider: true },
  { label: "− Costos fijos operativos", key: "fixedCosts" },
  { label: "− Amortización gastos de constitución", key: "amortization" },
  { label: "− Depreciación", key: "depreciation" },
  { label: "= Utilidad operativa", key: "operatingIncome", bold: true, divider: true },
  { label: "− Intereses del préstamo", key: "loanInterest" },
  { label: "= Utilidad antes de participación e impuestos", key: "incomeBeforeProfitSharing", bold: true, divider: true },
  { label: "− Participación trabajadores", key: "profitSharing" },
  { label: "= Utilidad antes de impuestos", key: "incomeBeforeTax", bold: true, divider: true },
  { label: "− Impuesto a la renta", key: "incomeTax" },
  { label: "= UTILIDAD NETA", key: "netIncome", bold: true, divider: true },
];

export default async function ProyeccionPage() {
  const supabase = await createServerSupabase();
  const { data: projection } = await supabase.from("financial_projection").select("*").eq("id", 1).maybeSingle();

  const initialInvestment = Number(projection?.initial_investment || 0);
  const discountRatePct = Number(projection?.discount_rate_pct || 10);
  const profitSharingPct = Number(projection?.profit_sharing_pct ?? 15);
  const incomeTaxPct = Number(projection?.income_tax_pct ?? 25);
  const years: ProjectionYear[] = (projection?.years?.length ? projection.years : Array(5).fill(EMPTY_YEAR)) as ProjectionYear[];

  const hasData = initialInvestment > 0 && years.some((y) => y.revenue !== 0);

  const incomeStatements = years.map((y) => computeIncomeStatement(y, profitSharingPct, incomeTaxPct));
  const { netCashFlow, accumulatedFlow } = computeCashFlow(initialInvestment, years, incomeStatements);
  const van = hasData ? computeVAN(initialInvestment, netCashFlow, discountRatePct) : null;
  const tir = hasData ? computeTIR(initialInvestment, netCashFlow) : null;
  const rbc = hasData ? computeRBC(initialInvestment, netCashFlow, discountRatePct) : null;
  const pri = hasData ? computePRI(initialInvestment, netCashFlow) : null;

  const yearLabels = ["Año 1", "Año 2", "Año 3", "Año 4", "Año 5"];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/finanzas" className="text-xs text-ink-700/50 hover:text-brand-600">← Finanzas</Link>
        <h1 className="mt-1 font-display text-2xl font-bold">Flujo de caja y evaluación financiera</h1>
        <p className="text-sm text-ink-700/60">
          Proyección a 5 años basada en los supuestos que ingreses (ingresos, costos, depreciación, préstamo, etc.).
          No se calcula sola a partir de las ventas reales — la actualizas cuando cambien tus proyecciones.
        </p>
      </div>

      {hasData ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="card p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/50">Tasa de descuento</p>
              <p className="mt-2 text-xl font-bold">{discountRatePct}%</p>
            </div>
            <div className="card p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/50">VAN</p>
              <p className={`mt-2 text-xl font-bold ${van !== null && van >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {van !== null ? formatUSD(van) : "—"}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/50">TIR</p>
              <p className="mt-2 text-xl font-bold text-brand-600">{tir !== null ? `${tir}%` : "No calculable"}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/50">RBC</p>
              <p className="mt-2 text-xl font-bold">{rbc !== null ? rbc.toFixed(2) : "—"}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/50">PRI</p>
              <p className="mt-2 text-xl font-bold">{priToYearsMonths(pri)}</p>
            </div>
          </div>

          <div className="card overflow-x-auto p-5">
            <h2 className="mb-4 font-semibold">Estado de resultados proyectado (5 años)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
                  <th className="px-3 py-2">Concepto</th>
                  {yearLabels.map((l) => (
                    <th key={l} className="px-3 py-2 text-right">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INCOME_STATEMENT_ROWS.map((row) => (
                  <tr key={row.key} className={row.divider ? "border-t border-ink-200" : "border-b border-ink-100"}>
                    <td className={`px-3 py-2 ${row.bold ? "font-semibold" : "text-ink-700/70"}`}>{row.label}</td>
                    {incomeStatements.map((stmt, i) => (
                      <td
                        key={i}
                        className={`px-3 py-2 text-right ${row.bold ? "font-semibold" : "text-ink-700/70"} ${
                          row.bold && stmt[row.key] < 0 ? "text-red-400" : ""
                        }`}
                      >
                        {formatUSD(stmt[row.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card overflow-x-auto p-5">
            <h2 className="mb-4 font-semibold">Flujo de caja proyectado</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
                  <th className="px-3 py-2">Concepto</th>
                  <th className="px-3 py-2 text-right">M0</th>
                  {yearLabels.map((l) => (
                    <th key={l} className="px-3 py-2 text-right">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-ink-100">
                  <td className="px-3 py-2 text-ink-700/70">Inversión (aporte de socios)</td>
                  <td className="px-3 py-2 text-right font-semibold text-red-400">-{formatUSD(initialInvestment)}</td>
                  {years.map((_, i) => <td key={i} className="px-3 py-2 text-right text-ink-700/30">—</td>)}
                </tr>
                <tr className="border-b border-ink-200 font-semibold">
                  <td className="px-3 py-2">Flujo de caja neto</td>
                  <td className="px-3 py-2 text-right text-red-400">-{formatUSD(initialInvestment)}</td>
                  {netCashFlow.map((v, i) => (
                    <td key={i} className={`px-3 py-2 text-right ${v >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatUSD(v)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold">Flujo acumulado</td>
                  <td className="px-3 py-2 text-right font-semibold text-red-400">-{formatUSD(initialInvestment)}</td>
                  {accumulatedFlow.map((v, i) => (
                    <td key={i} className={`px-3 py-2 text-right font-semibold ${v >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatUSD(v)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-4 font-semibold">Flujo de caja neto por año</h2>
              <BarChart
                categories={yearLabels}
                series={[{ label: "Flujo neto", color: "#7259B8", values: netCashFlow }]}
                formatValue={formatUSD}
              />
            </div>
            <div className="card p-5">
              <h2 className="mb-4 font-semibold">Flujo acumulado (recuperación de la inversión)</h2>
              <LineChart
                categories={yearLabels}
                series={[{ label: "Flujo acumulado", color: "#38BDF8", values: accumulatedFlow.map((v) => v + initialInvestment) }]}
                formatValue={(v) => formatUSD(v - initialInvestment)}
              />
              <p className="mt-2 text-xs text-ink-700/40">La línea parte del punto donde se recupera la inversión inicial.</p>
            </div>
          </div>
        </>
      ) : (
        <p className="card p-5 text-sm text-ink-700/60">
          Aún no hay una proyección guardada. Completa el formulario de abajo con la inversión inicial y los datos de
          los 5 años para ver el estado de resultados, el flujo de caja y los indicadores (VAN, TIR, RBC, PRI).
        </p>
      )}

      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Editar supuestos de la proyección</h2>
        <ProjectionForm
          initialInvestment={initialInvestment}
          discountRatePct={discountRatePct}
          profitSharingPct={profitSharingPct}
          incomeTaxPct={incomeTaxPct}
          years={years}
        />
      </div>
    </div>
  );
}
