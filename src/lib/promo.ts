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

export type Cart2x1Item = {
  priceUsd: number;
  quantity: number;
  depositPct: number;
  promoType?: string | null;
};

export type CartPricing = {
  totalPrice: number;
  totalDeposit: number;
  payableCount: number[]; // unidades pagadas por línea (mismo orden que "items")
  freeMap: boolean[][]; // freeMap[itemIndex][unidad] = true si esa unidad es gratis
};

// Empareja TODAS las unidades marcadas 2x1 del carrito (entre distintos productos
// también): en cada par se paga la unidad más cara y la más barata (o igual) es
// gratis, nunca al revés. Los productos sin 2x1 se cobran completos como siempre.
export function computeCartPricing(items: Cart2x1Item[]): CartPricing {
  type Unit = { itemIndex: number; withinIndex: number; priceUsd: number; depositPct: number };
  const units: Unit[] = [];

  items.forEach((item, itemIndex) => {
    for (let q = 0; q < item.quantity; q++) {
      units.push({ itemIndex, withinIndex: q, priceUsd: item.priceUsd, depositPct: item.depositPct });
    }
  });

  const eligible = units.filter((u) => items[u.itemIndex].promoType === "2x1");
  // Orden estable de mayor a menor precio: el índice de empate desempata para que
  // el resultado sea determinista entre cliente y servidor.
  const sorted = eligible
    .map((u, sortIdx) => ({ u, sortIdx }))
    .sort((a, b) => b.u.priceUsd - a.u.priceUsd || a.sortIdx - b.sortIdx)
    .map((e) => e.u);

  const freeMap: boolean[][] = items.map((item) => new Array(item.quantity).fill(false));
  sorted.forEach((u, rank) => {
    if (rank % 2 === 1) freeMap[u.itemIndex][u.withinIndex] = true;
  });

  let totalPrice = 0;
  let totalDeposit = 0;
  const payableCount = items.map(() => 0);

  units.forEach((u) => {
    if (!freeMap[u.itemIndex][u.withinIndex]) {
      totalPrice += u.priceUsd;
      totalDeposit += (u.priceUsd * u.depositPct) / 100;
      payableCount[u.itemIndex] += 1;
    }
  });

  return {
    totalPrice: Math.round(totalPrice * 100) / 100,
    totalDeposit: Math.round(totalDeposit * 100) / 100,
    payableCount,
    freeMap,
  };
}
