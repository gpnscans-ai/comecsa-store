"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartContext";
import { getEffectiveUnitPrice } from "@/lib/promo";
import type { Product } from "@/types/database";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const outOfStock = product.status === "agotado" || product.stock_quantity <= 0;

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.image_url,
      priceUsd: getEffectiveUnitPrice(product),
      depositPct: product.deposit_pct,
      promoType: product.promo_active && product.promo_type === "2x1" ? "2x1" : null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (outOfStock) {
    return (
      <button disabled className="btn-secondary w-full cursor-not-allowed opacity-50">
        Agotado
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button onClick={handleAdd} className="btn-secondary flex-1">
        {added ? "✓ Agregado" : "Agregar al carrito"}
      </button>
      <button
        onClick={() => {
          handleAdd();
          router.push("/carrito");
        }}
        className="btn-primary flex-1"
      >
        Reservar ahora
      </button>
    </div>
  );
}
