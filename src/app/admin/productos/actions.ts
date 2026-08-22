"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { ProductCategory, ProductStatus, PromoType } from "@/types/database";

export async function upsertProduct(formData: FormData) {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();

  const promoActive = formData.get("promo_active") === "on";
  const promoType = promoActive ? (String(formData.get("promo_type") || "percentage") as PromoType) : null;
  const promoValueRaw = String(formData.get("promo_value") || "").trim();
  const promoValue = promoActive && promoType !== "2x1" ? Number(promoValueRaw || 0) : null;

  if (promoActive && promoType !== "2x1" && !(promoValue && promoValue > 0)) {
    throw new Error("Ingresa un valor de descuento válido para la promoción");
  }
  if (promoActive && promoType === "percentage" && (promoValue || 0) > 100) {
    throw new Error("El porcentaje de descuento no puede ser mayor a 100");
  }

  const payload = {
    name,
    slug: slugify(name) + (id ? "" : "-" + Math.random().toString(36).slice(2, 6)),
    description: String(formData.get("description") || "").trim() || null,
    category: (String(formData.get("category") || "otro") as ProductCategory),
    status: (String(formData.get("status") || "disponible") as ProductStatus),
    image_url: String(formData.get("image_url") || "").trim() || null,
    source_url: String(formData.get("source_url") || "").trim() || null,
    cost_usd: Number(formData.get("cost_usd") || 0) || null,
    margin_pct: Number(formData.get("margin_pct") || 30),
    price_usd: Number(formData.get("price_usd") || 0),
    deposit_pct: Number(formData.get("deposit_pct") || 40),
    sizes: String(formData.get("sizes") || "").trim() || null,
    stock_quantity: Number(formData.get("stock_quantity") || 1),
    is_published: formData.get("is_published") === "on",
    promo_active: promoActive,
    promo_type: promoType,
    promo_value: promoValue,
  };

  if (!name) throw new Error("El nombre es obligatorio");

  if (id) {
    const { slug, ...updatePayload } = payload;
    const { error } = await supabase.from("products").update(updatePayload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("products").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function archiveProduct(formData: FormData) {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") || "");
  await supabase.from("products").update({ status: "archivado", is_published: false }).eq("id", id);
  revalidatePath("/admin/productos");
  revalidatePath("/");
}
