import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD, formatDate } from "@/lib/utils";
import { INVOICE_DOC_TYPE_LABEL, INVOICE_STATUS_LABEL, type Invoice } from "@/types/database";
import ImportButton from "@/components/admin/ImportButton";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  emitida: "bg-emerald-500/15 text-emerald-400",
  borrador: "bg-ink-100 text-ink-700/70",
  anulada: "bg-red-500/15 text-red-400",
};

export default async function FacturasPage() {
  const supabase = await createServerSupabase();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .order("issued_at", { ascending: false });

  const totalFacturado = (invoices || [])
    .filter((i: any) => i.status !== "anulada")
    .reduce((s: number, i: any) => s + Number(i.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Facturas</h1>
          <p className="text-sm text-ink-700/60">
            Total emitido: <span className="font-semibold text-brand-600">{formatUSD(totalFacturado)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/configuracion" className="btn-secondary">⚙ Datos del negocio</Link>
          <ImportButton type="facturas" />
          <Link href="/admin/facturas/nueva" className="btn-primary">+ Nueva factura</Link>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-4 py-3">N° comprobante</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoices || []).map((inv: Invoice) => (
              <tr key={inv.id} className="border-b border-ink-100 hover:bg-ink-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/facturas/${inv.id}`} className="font-mono text-xs hover:text-brand-600">
                    {inv.invoice_number}
                  </Link>
                </td>
                <td className="px-4 py-3">{inv.customer_name}</td>
                <td className="px-4 py-3 text-ink-700/70">{INVOICE_DOC_TYPE_LABEL[inv.doc_type]}</td>
                <td className="px-4 py-3 text-ink-700/70">{formatDate(inv.issued_at)}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_TONE[inv.status]}`}>{INVOICE_STATUS_LABEL[inv.status]}</span>
                </td>
                <td className="px-4 py-3 font-semibold">{formatUSD(inv.total)}</td>
              </tr>
            ))}
            {(!invoices || invoices.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-700/50">Aún no has emitido comprobantes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
