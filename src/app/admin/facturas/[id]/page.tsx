import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD, formatDate } from "@/lib/utils";
import { INVOICE_DOC_TYPE_LABEL, INVOICE_STATUS_LABEL, type Invoice } from "@/types/database";
import { voidInvoice } from "../actions";

export const dynamic = "force-dynamic";

export default async function FacturaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: invoice } = await supabase.from("invoices").select("*").eq("id", id).single<Invoice>();
  if (!invoice) notFound();

  const items = Array.isArray(invoice.items) ? invoice.items : [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/facturas" className="text-sm text-ink-700/50 hover:text-ink-900/70">← Facturas</Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-2xl font-bold font-mono">{invoice.invoice_number}</h1>
          <div className="flex gap-2">
            <a href={`/api/admin/invoices/${invoice.id}/pdf`} target="_blank" className="btn-primary">
              ⬇ Descargar PDF
            </a>
            {invoice.status !== "anulada" && (
              <form action={voidInvoice}>
                <input type="hidden" name="id" value={invoice.id} />
                <button type="submit" className="btn-secondary text-red-400">Anular</button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-700/70">
          <span className="badge bg-ink-100">{INVOICE_DOC_TYPE_LABEL[invoice.doc_type]}</span>
          <span className="badge bg-ink-100">{INVOICE_STATUS_LABEL[invoice.status]}</span>
          <span>{formatDate(invoice.issued_at)}</span>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Cliente</p>
          <p className="font-medium">{invoice.customer_name}</p>
          {invoice.customer_id_number && <p className="text-sm text-ink-700/70">CI/RUC: {invoice.customer_id_number}</p>}
          {invoice.customer_address && <p className="text-sm text-ink-700/70">{invoice.customer_address}</p>}
        </div>

        <div className="divide-y divide-ink-100 rounded-lg border border-ink-200">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{item.description} <span className="text-ink-700/50">x{item.quantity}</span></span>
              <span>{formatUSD(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="ml-auto w-56 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-ink-700/70">Subtotal</span><span>{formatUSD(invoice.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-ink-700/70">IVA ({invoice.iva_pct}%)</span><span>{formatUSD(invoice.iva_amount)}</span></div>
          <div className="flex justify-between border-t border-ink-200 pt-1 font-semibold"><span>Total</span><span className="text-brand-600">{formatUSD(invoice.total)}</span></div>
        </div>

        {invoice.notes && (
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-700/50">Notas</p>
            <p className="text-sm text-ink-700">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
