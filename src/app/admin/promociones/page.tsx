import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { NewsletterCampaign } from "@/types/database";
import { sendPromotion } from "./actions";

export const dynamic = "force-dynamic";

export default async function PromocionesPage() {
  const supabase = await createServerSupabase();

  const [{ count: activeCount }, { data: campaigns }] = await Promise.all([
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("newsletter_campaigns").select("*").order("sent_at", { ascending: false }).limit(20),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Promociones</h1>
        <p className="text-sm text-ink-700/60">
          Envía un correo de promoción a todos los clientes suscritos desde la tienda.
        </p>
      </div>

      <div className="card">
        <p className="text-sm text-ink-700/60">Suscriptores activos</p>
        <p className="text-3xl font-bold text-brand-600">{activeCount ?? 0}</p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-display text-lg font-bold">Nueva promoción</h2>
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
    </div>
  );
}
