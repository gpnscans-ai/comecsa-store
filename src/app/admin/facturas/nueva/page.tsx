import { createServerSupabase } from "@/lib/supabase/server";
import { createInvoice } from "../actions";
import InvoiceForm from "@/components/admin/InvoiceForm";

export const dynamic = "force-dynamic";

export default async function NuevaFacturaPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id } = await searchParams;
  const supabase = await createServerSupabase();

  const [{ data: customers }, { data: settings }] = await Promise.all([
    supabase.from("customers").select("id, full_name, address").order("full_name"),
    supabase.from("business_settings").select("*").eq("id", 1).single(),
  ]);

  let prefill: { orderId?: string; customerId?: string; itemName?: string; price?: number } | undefined;

  if (order_id) {
    const { data: order } = await supabase
      .from("orders")
      .select("id, item_name, price_usd, customer_id")
      .eq("id", order_id)
      .single();
    if (order) {
      prefill = {
        orderId: order.id,
        customerId: order.customer_id,
        itemName: order.item_name,
        price: Number(order.price_usd),
      };
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Nueva factura / nota de venta</h1>
      <InvoiceForm
        action={createInvoice}
        customers={customers || []}
        ivaPctDefault={settings?.iva_pct ?? 15}
        docTypeDefault={settings?.doc_type ?? "nota_venta"}
        prefill={prefill}
      />
    </div>
  );
}
