import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD, formatDate } from "@/lib/utils";
import { createFinanceEntry, deleteFinanceEntry } from "./actions";
import ExportButton from "@/components/admin/ExportButton";

export const dynamic = "force-dynamic";

function monthRange(monthParam?: string) {
  const base = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end, label: start.toLocaleDateString("es-EC", { month: "long", year: "numeric" }) };
}

export default async function FinanzasPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const { start, end, label } = monthRange(sp.month);

  const [{ data: entries }, { data: payments }] = await Promise.all([
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
  ]);

  const gastos = (entries || []).filter((e) => e.type === "gasto").reduce((s, e) => s + Number(e.amount), 0);
  const ingresosManual = (entries || []).filter((e) => e.type === "ingreso").reduce((s, e) => s + Number(e.amount), 0);
  const ventasCobradas = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const ingresosTotal = ingresosManual + ventasCobradas;
  const neto = ingresosTotal - gastos;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Finanzas</h1>
          <p className="text-sm capitalize text-ink-700/60">{label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton type="finanzas" />
          <form className="flex gap-2">
            <input className="input" type="month" name="month" defaultValue={sp.month} />
            <button className="btn-secondary" type="submit">Ver mes</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Ventas cobradas</p>
          <p className="mt-2 text-xl font-bold text-emerald-400">{formatUSD(ventasCobradas)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Otros ingresos</p>
          <p className="mt-2 text-xl font-bold text-emerald-400">{formatUSD(ingresosManual)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Gastos</p>
          <p className="mt-2 text-xl font-bold text-brand-600">{formatUSD(gastos)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Neto del mes</p>
          <p className={`mt-2 text-xl font-bold ${neto >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatUSD(neto)}</p>
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
                <tr><td colSpan={6} className="py-8 text-center text-ink-700/50">Sin movimientos este mes.</td></tr>
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
