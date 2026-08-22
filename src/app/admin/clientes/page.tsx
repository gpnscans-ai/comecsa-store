import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/utils";
import ExportButton from "@/components/admin/ExportButton";
import ImportButton from "@/components/admin/ImportButton";

export const dynamic = "force-dynamic";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createServerSupabase();
  const { q: qParam } = await searchParams;
  const q = qParam?.trim() || "";

  let query = supabase.from("customers").select("*").order("created_at", { ascending: false });
  if (q) query = query.ilike("full_name", `%${q}%`);
  const { data: customers } = await query;

  const { data: balances } = await supabase.from("customer_balances").select("*");
  const balanceMap = new Map((balances || []).map((b: any) => [b.customer_id, b]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Clientes (CRM)</h1>
          <p className="text-sm text-ink-700/60">Historial, contacto y saldo de cada cliente.</p>
        </div>
        <div className="flex gap-2">
          <ExportButton type="clientes" />
          <ImportButton type="clientes" />
          <Link href="/admin/clientes/nuevo" className="btn-primary">+ Nuevo cliente</Link>
        </div>
      </div>

      <form className="flex gap-2">
        <input className="input max-w-xs" type="search" name="q" placeholder="Buscar por nombre..." defaultValue={q} />
        <button className="btn-secondary" type="submit">Buscar</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3">Pedidos activos</th>
              <th className="px-4 py-3">Saldo pendiente</th>
            </tr>
          </thead>
          <tbody>
            {(customers || []).map((c) => {
              const bal = balanceMap.get(c.id);
              return (
                <tr key={c.id} className="border-b border-ink-100 hover:bg-ink-100">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clientes/${c.id}`} className="font-medium hover:text-brand-600">
                      {c.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-700/70">{c.whatsapp || c.phone || c.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-ink-100 text-ink-700 capitalize">{c.channel}</span>
                  </td>
                  <td className="px-4 py-3">{bal?.active_orders ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={Number(bal?.total_balance_due) > 0 ? "font-semibold text-brand-600" : "text-ink-700/50"}>
                      {formatUSD(bal?.total_balance_due ?? 0)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(!customers || customers.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-700/50">
                  No hay clientes todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
