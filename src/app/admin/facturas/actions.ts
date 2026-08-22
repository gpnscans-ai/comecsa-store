"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { InvoiceDocType, InvoiceItem } from "@/types/database";

export async function createInvoice(formData: FormData) {
  const supabase = await createServerSupabase();

  const { data: settings, error: settingsError } = await supabase
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (settingsError || !settings) throw new Error("No se pudo leer la configuración del negocio");

  const descriptions = formData.getAll("item_description") as string[];
  const quantities = formData.getAll("item_quantity") as string[];
  const unitPrices = formData.getAll("item_unit_price") as string[];

  const items: InvoiceItem[] = descriptions
    .map((description, i) => {
      const quantity = Number(quantities[i] || 0);
      const unit_price = Number(unitPrices[i] || 0);
      return {
        description: description.trim(),
        quantity,
        unit_price,
        subtotal: Math.round(quantity * unit_price * 100) / 100,
      };
    })
    .filter((item) => item.description && item.quantity > 0);

  if (items.length === 0) throw new Error("Agrega al menos un ítem con descripción y cantidad");

  const subtotal = Math.round(items.reduce((s, i) => s + i.subtotal, 0) * 100) / 100;
  const ivaPct = Number(formData.get("iva_pct") || settings.iva_pct);
  const ivaAmount = Math.round(subtotal * (ivaPct / 100) * 100) / 100;
  const total = Math.round((subtotal + ivaAmount) * 100) / 100;

  const { data: numberData, error: numberError } = await supabase.rpc("next_invoice_number");
  if (numberError || !numberData) throw new Error("No se pudo generar el número de comprobante");

  const payload = {
    invoice_number: numberData as string,
    doc_type: (String(formData.get("doc_type") || settings.doc_type) as InvoiceDocType),
    order_id: String(formData.get("order_id") || "") || null,
    customer_id: String(formData.get("customer_id") || "") || null,
    customer_name: String(formData.get("customer_name") || "").trim(),
    customer_id_number: String(formData.get("customer_id_number") || "").trim() || null,
    customer_address: String(formData.get("customer_address") || "").trim() || null,
    items,
    subtotal,
    iva_pct: ivaPct,
    iva_amount: ivaAmount,
    total,
    notes: String(formData.get("notes") || "").trim() || null,
  };

  if (!payload.customer_name) throw new Error("El nombre del cliente es obligatorio");

  const { data: invoice, error } = await supabase.from("invoices").insert(payload).select("id").single();
  if (error) throw new Error(error.message);

  revalidatePath("/admin/facturas");
  redirect(`/admin/facturas/${invoice.id}`);
}

export async function voidInvoice(formData: FormData) {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") || "");
  await supabase.from("invoices").update({ status: "anulada" }).eq("id", id);
  revalidatePath(`/admin/facturas/${id}`);
  revalidatePath("/admin/facturas");
}
