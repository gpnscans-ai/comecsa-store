"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartContext";
import type { Product } from "@/types/database";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.image_url,
      priceUsd: product.price_usd,
      depositPct: product.deposit_pct,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
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
