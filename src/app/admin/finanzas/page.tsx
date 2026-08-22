import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD, formatDate } from "@/lib/utils";
import { createFinanceEntry, deleteFinanceEntry } from "./actions";
import ExportButton from "@/components/admin/ExportButton";
import ImportButton from "@/components/admin/ImportButton";
import LineChart from "@/components/admin/charts/LineChart";
import DonutChart from "@/components/admin/charts/DonutChart";
import { EXPENSE_CLASS_LABEL, type ExpenseClass } from "@/types/database";

export const dynamic = "force-dynamic";

function monthRange(monthParam?: string) {
  const base = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end, label: start.toLocaleDateString("es-EC", { month: "long", year: "numeric" }) };
}

async function monthSummary(supabase: Awaited<ReturnType<typeof createServerSupabase>>, start: Date, end: Date) {
  const [{ data: soldOrders }, { data: entries }] = await Promise.all([
    supabase
      .from("orders")
      .select("price_usd, product:products(cost_usd)")
      .not("product_id", "is", null)
      .neq("status", "cancelado")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),
    supabase
      .from("finance_entries")
      .select("type, amount, expense_class")
      .gte("entry_date", start.toISOString().slice(0, 10))
      .lt("entry_date", end.toISOString().slice(0, 10)),
  ]);

  const ventas = (soldOrders || []).reduce((s, o: any) => s + Number(o.price_usd), 0);
  const costoVentas = (soldOrders || []).reduce((s, o: any) => s + Number(o.product?.cost_usd || 0), 0);
  const gastos = (entries || []).filter((e) => e.type === "gasto").reduce((s, e) => s + Number(e.amount), 0);
  const otrosIngresos = (entries || []).filter((e) => e.type === "ingreso").reduce((s, e) => s + Number(e.amount), 0);
  const utilidadNeta = ventas - costoVentas + otrosIngresos - gastos;

  return { ventas, costoVentas, utilidadNeta };
}

export default async function FinanzasPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const { start, end, label } = monthRange(sp.month);

  const [{ data: entries }, { data: payments }, { data: soldOrders }] = await Promise.all([
    supabase
      .from("finance_entries")
      .select("*")
      .gte("entry_date", start.toISOString().slice(0, 10))
      .lt("entry_date", end.toISOString().slice(0, 10))
      .order("entry_date", { ascending: false }),
    supabase
      .from("payments")
      .select("amount, paid_at")
      .gte("paid_at", start.toISOString())
      .lt("paid_at", end.toISOString()),
    supabase
      .from("orders")
      .select("price_usd, product:products(cost_usd)")
      .not("product_id", "is", null)
      .neq("status", "cancelado")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),
  ]);

  // --- Estado de resultados (base devengado: ventas = pedidos del mes, no solo lo cobrado) ---
  const ventas = (soldOrders || []).reduce((s, o: any) => s + Number(o.price_usd), 0);
  const costoVentas = (soldOrders || []).reduce((s, o: any) => s + Number(o.product?.cost_usd || 0), 0);
  const productosSinCosto = (soldOrders || []).filter((o: any) => o.product?.cost_usd == null).length;
  const utilidadBruta = ventas - costoVentas;

  const gastoEntries = (entries || []).filter((e) => e.type === "gasto");
  const clase = (e: (typeof gastoEntries)[number]) => (e.expense_class || "operativo") as ExpenseClass;
  const gastosOperativos = gastoEntries.filter((e) => clase(e) === "operativo").reduce((s, e) => s + Number(e.amount), 0);
  const otrosGastos = gastoEntries.filter((e) => clase(e) === "otro").reduce((s, e) => s + Number(e.amount), 0);
  const impuestos = gastoEntries.filter((e) => clase(e) === "impuesto").reduce((s, e) => s + Number(e.amount), 0);
  const otrosIngresos = (entries || []).filter((e) => e.type === "ingreso").reduce((s, e) => s + Number(e.amount), 0);

  const utilidadAntesImpuestos = utilidadBruta + otrosIngresos - gastosOperativos - otrosGastos;
  const utilidadNeta = utilidadAntesImpuestos - impuestos;

  const ventasCobradas = (payments || []).reduce((s, p) => s + Number(p.amount), 0);

  // --- Tendencia de los últimos 6 meses (incluye el mes que se está viendo) ---
  const monthsBack = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth() - (5 - i), 1);
    return { start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 1) };
  });
  const trend = await Promise.all(
    monthsBack.map(async (m) => ({
      label: m.start.toLocaleDateString("es-EC", { month: "short" }),
      ...(await monthSummary(supabase, m.start, m.end)),
    }))
  );
  const trendLabels = trend.map((t) => t.label);

  const gastosPorClase = [
    { label: "Operativo", value: gastosOperativos, color: "#7259B8" },
    { label: "Otro", value: otrosGastos, color: "#38BDF8" },
    { label: "Impuesto", value: impuestos, color: "#F472B6" },
  ];

  const ESTADO_ROWS: { label: string; value: number; bold?: boolean; indent?: boolean; divider?: boolean }[] = [
    { label: "Ventas", value: ventas, bold: true },
    { label: "− Costo de ventas", value: -costoVentas, indent: true },
    { label: "= Utilidad bruta", value: utilidadBruta, bold: true, divider: true },
    { label: "+ Otros ingresos", value: otrosIngresos, indent: true },
    { label: "− Gastos operativos", value: -gastosOperativos, indent: true },
    { label: "− Otros gastos", value: -otrosGastos, indent: true },
    { label: "= Utilidad antes de impuestos", value: utilidadAntesImpuestos, bold: true, divider: true },
    { label: "− Impuestos", value: -impuestos, indent: true },
    { label: "= Utilidad neta", value: utilidadNeta, bold: true, divider: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Finanzas</h1>
          <p className="text-sm capitalize text-ink-700/60">{label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/finanzas/proyeccion" className="btn-secondary">📈 Flujo de caja y evaluación</Link>
          <ExportButton type="finanzas" />
          <ImportButton type="finanzas" />
          <form className="flex gap-2">
            <input className="input" type="month" name="month" defaultValue={sp.month} />
            <button className="btn-secondary" type="submit">Ver mes</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Ventas</p>
          <p className="mt-2 text-xl font-bold text-emerald-400">{formatUSD(ventas)}</p>
          <p className="mt-1 text-xs text-ink-700/40">{formatUSD(ventasCobradas)} cobrado a la fecha</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Costo de ventas</p>
          <p className="mt-2 text-xl font-bold text-brand-600">{formatUSD(costoVentas)}</p>
          {productosSinCosto > 0 && (
            <p className="mt-1 text-xs text-amber-500">{productosSinCosto} pedido(s) sin costo registrado</p>
          )}
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Utilidad bruta</p>
          <p className={`mt-2 text-xl font-bold ${utilidadBruta >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatUSD(utilidadBruta)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Utilidad neta</p>
          <p className={`mt-2 text-xl font-bold ${utilidadNeta >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatUSD(utilidadNeta)}</p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-1 font-semibold">Estado de resultados</h2>
        <p className="mb-4 text-xs text-ink-700/50">
          Ventas y costo de ventas son de los pedidos del mes (no solo lo ya cobrado). Los impuestos se registran
          manualmente abajo — esta página no calcula impuestos automáticamente.
        </p>
        <table className="w-full max-w-lg text-sm">
          <tbody>
            {ESTADO_ROWS.map((row) => (
              <tr key={row.label} className={row.divider ? "border-t border-ink-200" : ""}>
                <td className={`py-2 ${row.bold ? "font-semibold" : "text-ink-700/70"} ${row.indent ? "pl-4" : ""}`}>
                  {row.label}
                </td>
                <td
                  className={`py-2 text-right ${row.bold ? "font-semibold" : ""} ${
                    row.value < 0 ? "text-red-400" : row.bold ? (row.value >= 0 ? "text-emerald-400" : "text-red-400") : "text-ink-700/70"
                  }`}
                >
                  {formatUSD(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2 p-5">
          <h2 className="mb-4 font-semibold">Ventas, costo de ventas y utilidad neta (últimos 6 meses)</h2>
          <LineChart
            categories={trendLabels}
            series={[
              { label: "Ventas", color: "#34D399", values: trend.map((t) => t.ventas) },
              { label: "Costo de ventas", color: "#F87171", values: trend.map((t) => t.costoVentas) },
              { label: "Utilidad neta", color: "#7259B8", values: trend.map((t) => t.utilidadNeta) },
            ]}
            formatValue={formatUSD}
          />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Gastos del mes por clasificación</h2>
          <DonutChart data={gastosPorClase} title="gastos" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2 overflow-x-auto p-5">
          <h2 className="mb-4 font-semibold">Movimientos manuales (gastos e ingresos varios)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
                <th className="py-2">Fecha</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Clasificación</th>
                <th className="py-2">Categoría</th>
                <th className="py-2">Descripción</th>
                <th className="py-2 text-right">Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(entries || []).map((e) => (
                <tr key={e.id} className="border-b border-ink-100">
                  <td className="py-2 text-ink-700/70">{formatDate(e.entry_date)}</td>
                  <td className="py-2">
                    <span className={`badge ${e.type === "gasto" ? "bg-brand-600/15 text-brand-600" : "bg-emerald-500/15 text-emerald-400"}`}>
                      {e.type}
                    </span>
                  </td>
                  <td className="py-2 text-ink-700/60">{e.type === "gasto" ? EXPENSE_CLASS_LABEL[(e.expense_class || "operativo") as ExpenseClass] : "—"}</td>
                  <td className="py-2 text-ink-700/70 capitalize">{e.category}</td>
                  <td className="py-2 text-ink-700/60">{e.description || "—"}</td>
                  <td className="py-2 text-right font-semibold">{formatUSD(e.amount)}</td>
                  <td className="py-2 text-right">
                    <form action={deleteFinanceEntry}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="text-xs text-ink-700/40 hover:text-red-400">quitar</button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!entries || entries.length === 0) && (
                <tr><td colSpan={7} className="py-8 text-center text-ink-700/50">Sin movimientos este mes.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Registrar movimiento</h2>
          <form action={createFinanceEntry} className="space-y-3">
            <div>
              <label className="label" htmlFor="type">Tipo</label>
              <select className="input" id="type" name="type" defaultValue="gasto">
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="expense_class">Clasificación (solo si es Gasto)</label>
              <select className="input" id="expense_class" name="expense_class" defaultValue="operativo">
                <option value="operativo">Gasto operativo (arriendo, sueldos, publicidad...)</option>
                <option value="otro">Otro gasto</option>
                <option value="impuesto">Impuesto</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="category">Categoría</label>
              <input className="input" id="category" name="category" placeholder="arriendo, servicios, envío..." required />
            </div>
            <div>
              <label className="label" htmlFor="description">Descripción</label>
              <input className="input" id="description" name="description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="amount">Monto</label>
                <input className="input" id="amount" name="amount" type="number" step="0.01" min="0.01" required />
              </div>
              <div>
                <label className="label" htmlFor="entry_date">Fecha</label>
                <input className="input" id="entry_date" name="entry_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">Guardar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
