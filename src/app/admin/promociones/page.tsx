import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatUSD } from "@/lib/utils";
import { DISCOUNT_TYPE_LABEL, type NewsletterCampaign } from "@/types/database";
import { sendPromotion, toggleDiscountCode } from "./actions";
import DiscountCodeForm from "@/components/admin/DiscountCodeForm";

export const dynamic = "force-dynamic";

export default async function PromocionesPage() {
  const supabase = await createServerSupabase();

  const [{ count: activeCount }, { data: campaigns }, { data: discountCodes }, { data: products }] = await Promise.all([
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("newsletter_campaigns").select("*").order("sent_at", { ascending: false }).limit(20),
    supabase
      .from("discount_codes")
      .select("*, discount_code_products(product:products(id, name))")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Promociones</h1>
        <p className="text-sm text-ink-700/60">
          Envía un correo de promoción a todos los clientes suscritos y administra códigos de descuento.
        </p>
      </div>

      <div className="card">
        <p className="text-sm text-ink-700/60">Suscriptores activos</p>
        <p className="text-3xl font-bold text-brand-600">{activeCount ?? 0}</p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-display text-lg font-bold">Nueva promoción por correo</h2>
        <form action={sendPromotion} className="space-y-4">
          <div>
            <label className="label">Asunto</label>
            <input className="input" name="subject" required placeholder="Ej: 20% de descuento esta semana" />
          </div>
          <div>
            <label className="label">Mensaje</label>
            <textarea
              className="input"
              name="body"
              rows={6}
              required
              placeholder="Escribe la promoción que verá el cliente..."
            />
          </div>
          <button type="submit" className="btn-primary" disabled={!activeCount}>
            Enviar a {activeCount ?? 0} suscriptor{activeCount === 1 ? "" : "es"}
          </button>
          {!activeCount && <p className="text-xs text-ink-700/50">Aún no hay suscriptores activos.</p>}
        </form>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-display text-lg font-bold">Historial de envíos</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-4 py-3">Asunto</th>
              <th className="px-4 py-3">Destinatarios</th>
              <th className="px-4 py-3">Enviado el</th>
            </tr>
          </thead>
          <tbody>
            {(campaigns || []).map((c: NewsletterCampaign) => (
              <tr key={c.id} className="border-b border-ink-100">
                <td className="px-4 py-3 font-medium">{c.subject}</td>
                <td className="px-4 py-3 text-ink-700/70">{c.recipients_count}</td>
                <td className="px-4 py-3 text-ink-700/70">{formatDate(c.sent_at)}</td>
              </tr>
            ))}
            {(!campaigns || campaigns.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink-700/50">Aún no has enviado promociones.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card space-y-4">
        <h2 className="font-display text-lg font-bold">Nuevo código de descuento</h2>
        <p className="text-sm text-ink-700/60">
          El cliente lo ingresa en el carrito. Se aplica automáticamente al total de los productos elegibles.
        </p>
        <DiscountCodeForm products={products || []} />
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-display text-lg font-bold">Códigos existentes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Descuento</th>
              <th className="px-4 py-3">Aplica a</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(discountCodes || []).map((c: any) => (
              <tr key={c.id} className="border-b border-ink-100">
                <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                <td className="px-4 py-3 text-ink-700/70">
                  {c.type === "percentage" ? `${Number(c.value)}%` : formatUSD(c.value)}
                  <span className="ml-1 text-xs text-ink-700/40">({DISCOUNT_TYPE_LABEL[c.type as "percentage" | "fixed"]})</span>
                </td>
                <td className="px-4 py-3 text-ink-700/70">
                  {c.discount_code_products?.length > 0
                    ? c.discount_code_products.map((r: any) => r.product?.name).filter(Boolean).join(", ")
                    : "Todo el catálogo"}
                </td>
                <td className="px-4 py-3 text-ink-700/70">
                  {c.times_used}
                  {c.usage_limit != null ? ` / ${c.usage_limit}` : ""}
                </td>
                <td className="px-4 py-3 text-ink-700/70">{c.expires_at ? formatDate(c.expires_at) : "Sin vencimiento"}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${c.active ? "bg-emerald-500/15 text-emerald-500" : "bg-ink-100 text-ink-700/50"}`}>
                    {c.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleDiscountCode}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={String(c.active)} />
                    <button type="submit" className="text-xs text-ink-700/50 hover:text-brand-600">
                      {c.active ? "desactivar" : "activar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!discountCodes || discountCodes.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-700/50">Aún no has creado códigos de descuento.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
