import { createServerSupabase } from "@/lib/supabase/server";
import { updateBusinessSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const supabase = await createServerSupabase();
  const { data: settings } = await supabase.from("business_settings").select("*").eq("id", 1).single();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Configuración del negocio</h1>
        <p className="text-sm text-ink-700/60">Estos datos aparecen en las facturas/notas de venta que generes.</p>
      </div>

      <div className="card border-amber-400/30 bg-amber-500/5 p-4 text-sm text-amber-200">
        ⚠️ Mientras el negocio no tenga <strong>firma electrónica</strong> registrada en el SRI, los comprobantes
        generados aquí son de uso interno / respaldo — no reemplazan una factura electrónica autorizada.
      </div>

      <form action={updateBusinessSettings} className="card space-y-4 p-6">
        <div>
          <label className="label" htmlFor="business_name">Razón social / Nombre del negocio</label>
          <input className="input" id="business_name" name="business_name" required defaultValue={settings?.business_name} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ruc">RUC (13 dígitos)</label>
            <input className="input" id="ruc" name="ruc" required pattern="\d{13}" defaultValue={settings?.ruc} />
          </div>
          <div>
            <label className="label" htmlFor="regimen">Régimen tributario</label>
            <input className="input" id="regimen" name="regimen" defaultValue={settings?.regimen || "RIMPE"} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="doc_type">Tipo de comprobante</label>
          <select className="input" id="doc_type" name="doc_type" defaultValue={settings?.doc_type || "nota_venta"}>
            <option value="nota_venta">Nota de venta</option>
            <option value="factura">Factura</option>
          </select>
          <p className="mt-1 text-xs text-ink-700/50">
            Confirma con tu contador cuál te corresponde emitir según tu categoría RIMPE.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="address">Dirección</label>
          <input className="input" id="address" name="address" defaultValue={settings?.address ?? ""} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">Teléfono</label>
            <input className="input" id="phone" name="phone" defaultValue={settings?.phone ?? ""} />
          </div>
          <div>
            <label className="label" htmlFor="email">Correo</label>
            <input className="input" id="email" name="email" type="email" defaultValue={settings?.email ?? ""} />
          </div>
        </div>

        <div className="rounded-lg border border-ink-200 p-3">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-700/60">Numeración (formato SRI)</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="establecimiento">Establecimiento</label>
              <input className="input" id="establecimiento" name="establecimiento" defaultValue={settings?.establecimiento || "001"} />
            </div>
            <div>
              <label className="label" htmlFor="punto_emision">Punto de emisión</label>
              <input className="input" id="punto_emision" name="punto_emision" defaultValue={settings?.punto_emision || "001"} />
            </div>
            <div>
              <label className="label" htmlFor="iva_pct">IVA %</label>
              <input className="input" id="iva_pct" name="iva_pct" type="number" step="0.01" defaultValue={settings?.iva_pct ?? 15} />
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-700/50">
            Próximo número a emitir: {settings?.establecimiento}-{settings?.punto_emision}-{String(settings?.next_sequential ?? 1).padStart(9, "0")}
          </p>
        </div>

        <button type="submit" className="btn-primary">Guardar</button>
      </form>
    </div>
  );
}
