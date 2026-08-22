import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/utils";
import { archiveSeller } from "./actions";
import type { Seller } from "@/types/database";

export const dynamic = "force-dynamic";

function monthRange(monthParam?: string) {
  const base = monthParam ? new Date(`${monthParam}-01T00:00:00`) : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end, label: start.toLocaleDateString("es-EC", { month: "long", year: "numeric" }) };
}

export default async function VendedoresPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const { start, end, label } = monthRange(sp.month);

  const [{ data: sellers }, { data: orders }] = await Promise.all([
    supabase.from("sellers").select("*").order("full_name"),
    supabase
      .from("orders")
      .select("seller_id, price_usd, status, created_at")
      .not("seller_id", "is", null)
      .neq("status", "cancelado")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),
  ]);

  const salesBySeller = new Map<string, { count: number; total: number }>();
  for (const o of orders || []) {
    const key = o.seller_id as string;
    const prev = salesBySeller.get(key) || { count: 0, total: 0 };
    prev.count += 1;
    prev.total += Number(o.price_usd);
    salesBySeller.set(key, prev);
  }

  const report = (sellers || []).map((s: Seller) => {
    const sales = salesBySeller.get(s.id) || { count: 0, total: 0 };
    return {
      ...s,
      orderCount: sales.count,
      totalSales: sales.total,
      commission: Math.round(sales.total * (s.commission_pct / 100) * 100) / 100,
    };
  });

  const totalCommission = report.reduce((s, r) => s + r.commission, 0);
  const totalSales = report.reduce((s, r) => s + r.totalSales, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Vendedores</h1>
          <p className="text-sm capitalize text-ink-700/60">Ventas y comisiones — {label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form className="flex gap-2">
            <input className="input" type="month" name="month" defaultValue={sp.month} />
            <button className="btn-secondary" type="submit">Ver mes</button>
          </form>
          <Link href="/admin/vendedores/nuevo" className="btn-primary">+ Nuevo vendedor</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Vendedores activos</p>
          <p className="mt-2 text-xl font-bold text-ink-900">{(sellers || []).filter((s: Seller) => s.active).length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Ventas asignadas (mes)</p>
          <p className="mt-2 text-xl font-bold text-ink-900">{formatUSD(totalSales)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Comisiones a pagar (mes)</p>
          <p className="mt-2 text-xl font-bold text-brand-600">{formatUSD(totalCommission)}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Comisión %</th>
              <th className="px-4 py-3">Pedidos (mes)</th>
              <th className="px-4 py-3">Ventas (mes)</th>
              <th className="px-4 py-3">Comisión (mes)</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {report.map((s) => (
              <tr key={s.id} className="border-b border-ink-100 hover:bg-ink-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/vendedores/${s.id}`} className="font-medium hover:text-brand-600">{s.full_name}</Link>
                </td>
                <td className="px-4 py-3 text-ink-700/70">{s.commission_pct}%</td>
                <td className="px-4 py-3 text-ink-700/70">{s.orderCount}</td>
                <td className="px-4 py-3 font-medium">{formatUSD(s.totalSales)}</td>
                <td className="px-4 py-3 font-semibold text-brand-600">{formatUSD(s.commission)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${s.active ? "bg-emerald-500/15 text-emerald-600" : "bg-ink-100 text-ink-700/50"}`}>
                    {s.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {s.active && (
                    <form action={archiveSeller}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="text-xs text-ink-700/50 hover:text-red-400">desactivar</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {report.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-700/50">Aún no hay vendedores registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
