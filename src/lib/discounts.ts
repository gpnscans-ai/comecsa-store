import { createAdminSupabase } from "@/lib/supabase/admin";
import type { DiscountType } from "@/types/database";

export type DiscountCartItem = { productId: string; priceUsd: number; quantity: number };

export type DiscountValidation =
  | {
      valid: true;
      code: string;
      type: DiscountType;
      value: number;
      discountAmount: number;
      eligibleSubtotal: number;
      appliesToProductIds: string[] | null; // null = aplica a todo el carrito
    }
  | { valid: false; error: string };

export function computeDiscountAmount(type: DiscountType, value: number, subtotal: number) {
  const amount = type === "percentage" ? subtotal * (value / 100) : value;
  return Math.round(Math.min(Math.max(amount, 0), subtotal) * 100) / 100;
}

export async function validateDiscountCode(rawCode: string, items: DiscountCartItem[]): Promise<DiscountValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, error: "Ingresa un código" };
  if (items.length === 0) return { valid: false, error: "El carrito está vacío" };

  const admin = createAdminSupabase();
  const { data: discount } = await admin.from("discount_codes").select("*").eq("code", code).maybeSingle();

  if (!discount) return { valid: false, error: "Código no válido" };
  if (!discount.active) return { valid: false, error: "Este código ya no está activo" };
  if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
    return { valid: false, error: "Este código expiró" };
  }
  if (discount.usage_limit != null && discount.times_used >= discount.usage_limit) {
    return { valid: false, error: "Este código alcanzó su límite de usos" };
  }

  const { data: scopeRows } = await admin
    .from("discount_code_products")
    .select("product_id")
    .eq("discount_code_id", discount.id);

  const scopedProductIds = (scopeRows || []).map((r) => r.product_id as string);
  const appliesToProductIds = scopedProductIds.length > 0 ? scopedProductIds : null;

  const eligibleItems = appliesToProductIds
    ? items.filter((i) => appliesToProductIds.includes(i.productId))
    : items;

  const eligibleSubtotal = Math.round(eligibleItems.reduce((s, i) => s + i.priceUsd * i.quantity, 0) * 100) / 100;

  if (eligibleSubtotal <= 0) {
    return { valid: false, error: "Este código no aplica a los productos de tu carrito" };
  }

  const discountAmount = computeDiscountAmount(discount.type, Number(discount.value), eligibleSubtotal);

  return {
    valid: true,
    code: discount.code,
    type: discount.type,
    value: Number(discount.value),
    discountAmount,
    eligibleSubtotal,
    appliesToProductIds,
  };
}
