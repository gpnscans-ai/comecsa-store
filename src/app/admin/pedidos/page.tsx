import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/utils";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, type OrderStatus } from "@/types/database";
import ExportButton from "@/components/admin/ExportButton";
import ImportButton from "@/components/admin/ImportButton";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<OrderStatus, string> = {
  pendiente: "bg-ink-100 text-ink-700",
  confirmado: "bg-amber-500/15 text-amber-600",
  en_preparacion: "bg-sky-500/15 text-sky-600",
  listo_retiro: "bg-purple-500/15 text-purple-600",
  enviado: "bg-indigo-500/15 text-indigo-600",
  entregado: "bg-emerald-500/15 text-emerald-600",
  cancelado: "bg-red-500/15 text-red-500",
};

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const supabase = await createServerSupabase();
  const sp = await searchParams;
  const status = sp.status as OrderStatus | undefined;
  const q = sp.q?.trim();

  let query = supabase
    .from("orders")
    .select("*, customer:customers(id, full_name), seller:sellers(full_name)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("item_name", `%${q}%`);

  const [{ data: orders }, { data: balances }] = await Promise.all([
    query,
    supabase.from("order_balances").select("order_id, balance_due"),
  ]);
  const balanceMap = new Map((balances || []).map((b: any) => [b.order_id, b.balance_due]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Pedidos</h1>
          <p className="text-sm text-ink-700/60">Pipeline completo: pendiente → confirmado → preparación → retiro/envío → entrega.</p>
        </div>
        <div className="flex gap-2">
          <ExportButton type="pedidos" />
          <ImportButton type="pedidos" />
          <Link href="/admin/pedidos/nuevo" className="btn-primary">+ Nuevo pedido</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/pedidos" className={`badge ${!status ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700/70"}`}>
          Todos
        </Link>
        {ORDER_STATUS_FLOW.concat(["cancelado"]).map((s) => (
          <Link key={s} href={`/admin/pedidos?status=${s}`} className={`badge ${status === s ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700/70"}`}>
            {ORDER_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Tracking</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {(orders || []).map((o: any) => (
              <tr key={o.id} className="border-b border-ink-100 hover:bg-ink-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${o.id}`} className="font-medium hover:text-brand-600">
                    {o.item_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-700/70">{o.customer?.full_name}</td>
                <td className="px-4 py-3 text-ink-700/70">{o.seller?.full_name || "—"}</td>
                <td className="px-4 py-3 text-ink-700/70">{o.tracking_number || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_TONE[o.status as OrderStatus]}`}>{ORDER_STATUS_LABEL[o.status as OrderStatus]}</span>
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatUSD(balanceMap.get(o.id) ?? o.price_usd)}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-700/50">Sin pedidos en este filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
