import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import CustomerForm from "@/components/admin/CustomerForm";
import { formatUSD, formatDate, whatsappLink } from "@/lib/utils";
import { ORDER_STATUS_LABEL, type Order } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single();
  if (!customer) notFound();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const orderIds = (orders || []).map((o) => o.id);
  const { data: balances } = orderIds.length
    ? await supabase.from("order_balances").select("order_id, paid_total, balance_due").in("order_id", orderIds)
    : { data: [] as { order_id: string; paid_total: number; balance_due: number }[] };
  const balanceMap = new Map((balances || []).map((b) => [b.order_id, b]));

  const totalDue = (orders || []).reduce((sum: number, o: any) => sum + Number(balanceMap.get(o.id)?.balance_due ?? o.price_usd), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/clientes" className="text-sm text-ink-700/50 hover:text-ink-900/70">← Clientes</Link>
          <h1 className="font-display text-2xl font-bold">{customer.full_name}</h1>
        </div>
        <div className="flex gap-2">
          {customer.whatsapp && (
            <a
              href={whatsappLink(customer.whatsapp, `Hola ${customer.full_name}, te escribo de COMECSA sobre tu pedido:`)}
              target="_blank"
              className="btn-secondary"
            >
              WhatsApp
            </a>
          )}
          <Link href={`/admin/pedidos/nuevo?customer_id=${customer.id}`} className="btn-primary">
            + Nuevo pedido
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Pedidos ({orders?.length ?? 0})</h2>
              <span className="text-sm text-ink-700/60">Saldo total: <span className="font-semibold text-brand-600">{formatUSD(totalDue)}</span></span>
            </div>
            <div className="mt-4 space-y-2">
              {(orders || []).map((o: any) => {
                const bal = balanceMap.get(o.id);
                return (
                  <Link
                    key={o.id}
                    href={`/admin/pedidos/${o.id}`}
                    className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-3 hover:bg-ink-100"
                  >
                    <div>
                      <p className="text-sm font-medium">{o.item_name}</p>
                      <p className="text-xs text-ink-700/50">
                        {formatDate(o.created_at)} · {o.tracking_number || "sin tracking"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="badge bg-ink-100 text-ink-700">{ORDER_STATUS_LABEL[o.status as Order["status"]]}</span>
                      <p className="mt-1 text-sm font-semibold">
                        {formatUSD(bal?.balance_due ?? o.price_usd)} <span className="font-normal text-ink-700/50">/ {formatUSD(o.price_usd)}</span>
                      </p>
                    </div>
                  </Link>
                );
              })}
              {(!orders || orders.length === 0) && (
                <p className="py-6 text-center text-sm text-ink-700/50">Sin pedidos todavía.</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-semibold">Datos del cliente</h2>
          <CustomerForm customer={customer} />
        </div>
      </div>
    </div>
  );
}
