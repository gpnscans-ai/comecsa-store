import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD, formatDate } from "@/lib/utils";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/types/database";
import { updateOrder, addPayment, deletePayment } from "../actions";

export const dynamic = "force-dynamic";

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: order } = await supabase
    .from("orders")
    .select("*, customer:customers(id, full_name, whatsapp)")
    .eq("id", id)
    .single();
  if (!order) notFound();

  const [{ data: payments }, { data: sellers }] = await Promise.all([
    supabase.from("payments").select("*").eq("order_id", id).order("paid_at", { ascending: false }),
    supabase.from("sellers").select("id, full_name").eq("active", true).order("full_name"),
  ]);

  const paidTotal = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const balance = Number(order.price_usd) - paidTotal;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pedidos" className="text-sm text-ink-700/50 hover:text-ink-900/70">← Pedidos</Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-2xl font-bold">{order.item_name}</h1>
          <div className="flex items-center gap-3">
            <Link href={`/admin/facturas/nueva?order_id=${order.id}`} className="text-sm text-ink-700/60 hover:text-ink-900">
              🧾 Generar factura
            </Link>
            <Link href={`/admin/clientes/${order.customer.id}`} className="text-sm text-brand-600 hover:underline">
              {order.customer.full_name} →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form action={updateOrder} className="card lg:col-span-2 space-y-4 p-6">
          <input type="hidden" name="id" value={order.id} />

          <div>
            <label className="label" htmlFor="item_name">Nombre del producto</label>
            <input className="input" id="item_name" name="item_name" defaultValue={order.item_name} required />
          </div>

          <div>
            <label className="label" htmlFor="price_usd">Precio total (USD)</label>
            <input className="input" id="price_usd" name="price_usd" type="number" step="0.01" defaultValue={order.price_usd} />
          </div>

          <div>
            <label className="label" htmlFor="status">Estado del pedido</label>
            <select className="input" id="status" name="status" defaultValue={order.status}>
              {ORDER_STATUS_FLOW.concat(["cancelado"]).map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="seller_id">Vendedor</label>
            <select className="input" id="seller_id" name="seller_id" defaultValue={order.seller_id || ""}>
              <option value="">— Sin asignar —</option>
              {(sellers || []).map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="tracking_number">N° de guía (envío a domicilio)</label>
              <input className="input" id="tracking_number" name="tracking_number" defaultValue={order.tracking_number ?? ""} placeholder="Ej: SE-0001234" />
            </div>
            <div>
              <label className="label" htmlFor="tracking_carrier">Courier</label>
              <input className="input" id="tracking_carrier" name="tracking_carrier" defaultValue={order.tracking_carrier ?? ""} placeholder="Servientrega, Laar, etc." />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="shipping_notes">Notas de envío</label>
            <textarea className="input" id="shipping_notes" name="shipping_notes" rows={2} defaultValue={order.shipping_notes ?? ""} />
          </div>

          <div>
            <label className="label" htmlFor="internal_notes">Notas internas</label>
            <textarea className="input" id="internal_notes" name="internal_notes" rows={2} defaultValue={order.internal_notes ?? ""} />
          </div>

          <button type="submit" className="btn-primary">Guardar cambios</button>
        </form>

        <div className="space-y-6">
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-ink-700/50">Saldo pendiente</p>
            <p className={`mt-1 text-2xl font-bold ${balance > 0 ? "text-brand-600" : "text-emerald-400"}`}>
              {formatUSD(balance)}
            </p>
            <p className="text-xs text-ink-700/50">Pagado {formatUSD(paidTotal)} de {formatUSD(order.price_usd)}</p>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-semibold">Registrar pago</h2>
            <form action={addPayment} className="space-y-3">
              <input type="hidden" name="order_id" value={order.id} />
              <div>
                <label className="label" htmlFor="amount">Monto</label>
                <input className="input" id="amount" name="amount" type="number" step="0.01" min="0.01" required />
              </div>
              <div>
                <label className="label" htmlFor="method">Método</label>
                <select className="input" id="method" name="method" defaultValue="transferencia">
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="stripe">Stripe</option>
                  <option value="kushki">Kushki</option>
                  <option value="payphone">PayPhone</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">Agregar pago</button>
            </form>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-semibold">Historial de pagos</h2>
            <div className="space-y-2">
              {(payments || []).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p>{formatUSD(p.amount)} <span className="text-ink-700/50 capitalize">· {p.method}</span></p>
                    <p className="text-xs text-ink-700/50">{formatDate(p.paid_at)}</p>
                  </div>
                  <form action={deletePayment}>
                    <input type="hidden" name="payment_id" value={p.id} />
                    <input type="hidden" name="order_id" value={order.id} />
                    <button type="submit" className="text-xs text-red-400 hover:underline">quitar</button>
                  </form>
                </div>
              ))}
              {(!payments || payments.length === 0) && <p className="text-sm text-ink-700/50">Sin pagos registrados.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
