import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Header from "@/components/store/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD, formatDate } from "@/lib/utils";
import { getEffectiveUnitPrice } from "@/lib/promo";
import { withIva, DEFAULT_IVA_PCT } from "@/lib/tax";
import ReorderButton from "@/components/store/ReorderButton";
import { ORDER_STATUS_LABEL, ORDER_STATUS_FLOW, type OrderStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<OrderStatus, string> = {
  pendiente: "bg-ink-100 text-ink-700",
  confirmado: "bg-sky-100 text-sky-700",
  en_preparacion: "bg-amber-100 text-amber-700",
  listo_retiro: "bg-emerald-100 text-emerald-700",
  enviado: "bg-emerald-100 text-emerald-700",
  entregado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
};

function shortOrderNumber(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export default async function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/cuenta/login");

  const { data: customer } = await supabase.from("customers").select("*").eq("user_id", session.user.id).maybeSingle();
  if (!customer) notFound();

  // Filtrado explícito por customer_id: un cliente nunca debe poder ver el
  // pedido de otro cambiando el id en la URL (además del RLS de por sí).
  const { data: order } = await supabase
    .from("orders")
    .select("*, product:products(id, slug, name, image_url, price_usd, deposit_pct, promo_active, promo_type, promo_value)")
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: payments }, { data: settings }] = await Promise.all([
    supabase.from("payments").select("*").eq("order_id", id).order("paid_at", { ascending: false }),
    supabase.from("business_settings").select("iva_pct").eq("id", 1).maybeSingle(),
  ]);

  const ivaPct = settings?.iva_pct != null ? Number(settings.iva_pct) : DEFAULT_IVA_PCT;
  const totalConIva = Number(order.price_usd);
  const subtotalSinIva = Math.round((totalConIva / (1 + ivaPct / 100)) * 100) / 100;
  const ivaAmount = Math.round((totalConIva - subtotalSinIva) * 100) / 100;

  const paidTotal = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const balanceDue = Math.round((totalConIva - paidTotal) * 100) / 100;
  const lastPayment = payments?.[0];

  const currentStepIndex = order.status === "cancelado" ? -1 : ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Link href="/cuenta/pedidos" className="text-xs font-medium uppercase tracking-wide text-ink-700/50 hover:text-brand-600">
          ← Pedidos
        </Link>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Pedido {shortOrderNumber(order.id)}</h1>
          {order.product && (
            <ReorderButton
              product={{
                id: order.product.id,
                slug: order.product.slug,
                name: order.product.name,
                image_url: order.product.image_url,
                price_usd: withIva(getEffectiveUnitPrice(order.product), ivaPct),
                deposit_pct: order.product.deposit_pct,
              }}
            />
          )}
        </div>

        <div className="mt-2 flex items-center gap-3">
          <span className="text-sm text-ink-700/60">{formatDate(order.created_at)}</span>
          <span className={`badge ${STATUS_TONE[order.status as OrderStatus]}`}>{ORDER_STATUS_LABEL[order.status as OrderStatus]}</span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-700/50">Datos de contacto</p>
            <p className="text-sm font-medium">{customer.full_name}</p>
            {customer.whatsapp && <p className="text-sm text-ink-700/70">{customer.whatsapp}</p>}
            {customer.address && <p className="text-sm text-ink-700/70">{customer.address}</p>}
            {customer.city && <p className="text-sm text-ink-700/70">{customer.city}, Ecuador</p>}
            {order.shipping_notes && <p className="mt-2 text-xs text-ink-700/50">Nota: {order.shipping_notes}</p>}
          </div>

          <div className="card p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-700/50">Forma de pago</p>
            {lastPayment ? (
              <p className="text-sm font-medium capitalize">{lastPayment.method}</p>
            ) : (
              <p className="text-sm text-ink-700/60">Pago pendiente</p>
            )}
            <p className="mt-1 text-sm text-ink-700/70">Pagado: {formatUSD(paidTotal)}</p>
            {balanceDue > 0 && <p className="text-sm text-amber-600">Saldo pendiente: {formatUSD(balanceDue)}</p>}
          </div>

          <div className="card p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-700/50">Resumen</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-ink-700/70">
                <span>Subtotal</span>
                <span>{formatUSD(subtotalSinIva)}</span>
              </div>
              <div className="flex justify-between text-ink-700/70">
                <span>IVA ({ivaPct}%)</span>
                <span>{formatUSD(ivaAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-1 font-semibold text-brand-600">
                <span>Total</span>
                <span>{formatUSD(totalConIva)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-6 p-6">
          <p className="mb-6 text-xs font-semibold uppercase tracking-wide text-ink-700/50">Estado del pedido</p>
          {order.status === "cancelado" ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">Este pedido fue cancelado.</p>
          ) : (
            <div className="flex items-start justify-between">
              {ORDER_STATUS_FLOW.map((step, i) => (
                <div key={step} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <div className={`h-px flex-1 ${i === 0 ? "invisible" : i <= currentStepIndex ? "bg-emerald-500" : "bg-ink-200"}`} />
                    <div
                      className={`h-3 w-3 shrink-0 rounded-full ${i <= currentStepIndex ? "bg-emerald-500" : "border-2 border-ink-200 bg-white"}`}
                    />
                    <div className={`h-px flex-1 ${i === ORDER_STATUS_FLOW.length - 1 ? "invisible" : i < currentStepIndex ? "bg-emerald-500" : "bg-ink-200"}`} />
                  </div>
                  <p className={`mt-2 max-w-[80px] text-xs ${i <= currentStepIndex ? "font-medium text-ink-900" : "text-ink-700/40"}`}>
                    {ORDER_STATUS_LABEL[step]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {order.product && (
          <div className="card mt-6 flex items-center gap-4 p-5">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
              {order.product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.product.image_url} alt={order.item_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🛍️</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/productos/${order.product.slug}`} className="font-medium text-brand-600 hover:underline">
                {order.item_name}
              </Link>
              <p className="mt-1 text-sm text-ink-700/60">1 ud. · {formatUSD(order.price_usd)}</p>
              {order.tracking_number && (
                <p className="mt-1 text-xs text-ink-700/50">
                  Guía: {order.tracking_number}{order.tracking_carrier ? ` (${order.tracking_carrier})` : ""}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
