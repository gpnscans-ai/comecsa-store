import { createServerSupabase } from "@/lib/supabase/server";
import { createOrder } from "../actions";

export default async function NuevoPedidoPage({ searchParams }: { searchParams: Promise<{ customer_id?: string }> }) {
  const { customer_id } = await searchParams;
  const supabase = await createServerSupabase();
  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase.from("customers").select("id, full_name").order("full_name"),
    supabase.from("products").select("id, name, price_usd").order("name"),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Nuevo pedido</h1>

      <form action={createOrder} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="customer_id">Cliente *</label>
          <select className="input" id="customer_id" name="customer_id" required defaultValue={customer_id || ""}>
            <option value="" disabled>Selecciona un cliente</option>
            {(customers || []).map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="product_id">Producto del catálogo (opcional)</label>
          <select className="input" id="product_id" name="product_id" defaultValue="">
            <option value="">— Pedido personalizado / fuera de catálogo —</option>
            {(products || []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="item_name">Nombre del producto *</label>
          <input className="input" id="item_name" name="item_name" required placeholder="Ej: Zapato casual unisex" />
        </div>

        <div>
          <label className="label" htmlFor="price_usd">Precio total (USD) *</label>
          <input className="input" id="price_usd" name="price_usd" type="number" step="0.01" min="0" required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-ink-200 p-3">
          <div>
            <label className="label" htmlFor="initial_deposit">Abono inicial (opcional)</label>
            <input className="input" id="initial_deposit" name="initial_deposit" type="number" step="0.01" min="0" />
          </div>
          <div>
            <label className="label" htmlFor="deposit_method">Método de pago</label>
            <select className="input" id="deposit_method" name="deposit_method" defaultValue="transferencia">
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="stripe">Stripe</option>
              <option value="kushki">Kushki</option>
              <option value="payphone">PayPhone</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="internal_notes">Notas internas</label>
          <textarea className="input" id="internal_notes" name="internal_notes" rows={2} />
        </div>

        <button type="submit" className="btn-primary">Crear pedido</button>
      </form>
    </div>
  );
}
