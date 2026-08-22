"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import type { InvoiceDocType } from "@/types/database";

export async function updateBusinessSettings(formData: FormData) {
  const supabase = await createServerSupabase();

  const payload = {
    business_name: String(formData.get("business_name") || "").trim(),
    ruc: String(formData.get("ruc") || "").trim(),
    regimen: String(formData.get("regimen") || "RIMPE").trim(),
    doc_type: (String(formData.get("doc_type") || "nota_venta") as InvoiceDocType),
    address: String(formData.get("address") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    establecimiento: String(formData.get("establecimiento") || "001").trim(),
    punto_emision: String(formData.get("punto_emision") || "001").trim(),
    iva_pct: Number(formData.get("iva_pct") || 15),
  };

  if (!payload.business_name) throw new Error("El nombre del negocio es obligatorio");
  if (!/^\d{13}$/.test(payload.ruc)) throw new Error("El RUC debe tener 13 dígitos");

  const { error } = await supabase.from("business_settings").update(payload).eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracion");
}
