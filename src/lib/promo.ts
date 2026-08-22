import type { Product } from "@/types/database";

type PromoProduct = Pick<Product, "price_usd" | "promo_active" | "promo_type" | "promo_value">;

// Precio por unidad ya con el descuento aplicado (percentage/fixed). El 2x1 no
// reduce el precio unitario: se paga la unidad completa, el ahorro es por cantidad.
export function getEffectiveUnitPrice(product: PromoProduct): number {
  if (!product.promo_active || !product.promo_type) return product.price_usd;

  if (product.promo_type === "percentage") {
    const pct = product.promo_value || 0;
    return Math.max(0, Math.round(product.price_usd * (1 - pct / 100) * 100) / 100);
  }

  if (product.promo_type === "fixed") {
    const off = product.promo_value || 0;
    return Math.max(0, Math.round((product.price_usd - off) * 100) / 100);
  }

  return product.price_usd;
}

export function promoBadgeLabel(product: Pick<Product, "promo_active" | "promo_type" | "promo_value">): string | null {
  if (!product.promo_active || !product.promo_type) return null;
  if (product.promo_type === "percentage") return `-${product.promo_value}%`;
  if (product.promo_type === "fixed") return `-$${product.promo_value}`;
  return "2x1";
}

// Unidades que realmente se cobran dado un promo 2x1 (cada 2da unidad es gratis).
export function payableUnits(quantity: number, promoType?: string | null): number {
  if (promoType === "2x1") return quantity - Math.floor(quantity / 2);
  return quantity;
}
