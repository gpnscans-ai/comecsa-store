import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABEL, type Order } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function MisPedidosPage() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/cuenta/login");

  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Mis pedidos</h1>
          <Link href="/cuenta" className="text-sm text-ink-700/60 hover:text-brand-600">← Mi cuenta</Link>
        </div>

        {(!orders || orders.length === 0) && (
          <div className="card p-8 text-center text-ink-700/60">
            <p>Todavía no tienes pedidos.</p>
            <Link href="/" className="mt-3 inline-block text-brand-600 hover:underline">Ver catálogo →</Link>
          </div>
        )}

        <div className="space-y-3">
          {(orders || []).map((o: Order) => (
            <div key={o.id} className="card flex items-center justify-between p-5">
              <div>
                <p className="font-medium">{o.item_name}</p>
                <p className="text-xs text-ink-700/50">{formatDate(o.created_at)}</p>
                {o.tracking_number && (
                  <p className="text-xs text-ink-700/50">Guía: {o.tracking_number}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-brand-600">{formatUSD(o.price_usd)}</p>
                <span className="badge bg-brand-50 text-brand-700">{ORDER_STATUS_LABEL[o.status]}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
