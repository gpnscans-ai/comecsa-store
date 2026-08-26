import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/types/database";

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

export default async function MisPedidosPage() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/cuenta/login");

  const { data: customer } = await supabase.from("customers").select("id").eq("user_id", session.user.id).maybeSingle();

  const { data: orders } = customer
    ? await supabase
        .from("orders")
        .select("*, product:products(slug, image_url)")
        .eq("customer_id", customer.id)
        .not("product_id", "is", null)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Pedidos</h1>
          <Link href="/cuenta" className="text-sm text-ink-700/60 hover:text-brand-600">← Mi cuenta</Link>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="card p-8 text-center text-ink-700/60">
            <p>Todavía no tienes pedidos.</p>
            <Link href="/" className="mt-3 inline-block text-brand-600 hover:underline">Ver catálogo →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o: any) => (
              <div key={o.id} className="card overflow-hidden p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/60 px-5 py-3">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-ink-700/50">Fecha del pedido</p>
                      <p className="text-sm font-medium">{formatDate(o.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-ink-700/50">Total</p>
                      <p className="text-sm font-medium">{formatUSD(o.price_usd)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-700/40">{shortOrderNumber(o.id)}</span>
                    <span className={`badge ${STATUS_TONE[o.status as OrderStatus]}`}>{ORDER_STATUS_LABEL[o.status as OrderStatus]}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 p-5">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    {o.product?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.product.image_url} alt={o.item_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {o.product?.slug ? (
                      <Link href={`/productos/${o.product.slug}`} className="font-medium text-brand-600 hover:underline">
                        {o.item_name}
                      </Link>
                    ) : (
                      <p className="font-medium">{o.item_name}</p>
                    )}
                    <p className="mt-1 text-sm text-ink-700/60">1 ud. · {formatUSD(o.price_usd)}</p>
                  </div>
                  <Link href={`/cuenta/pedidos/${o.id}`} className="btn-secondary shrink-0 text-sm">
                    Ver detalles del pedido
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
