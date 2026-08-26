"use client";

import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";

export default function ReorderButton({
  product,
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    image_url: string | null;
    price_usd: number;
    deposit_pct: number;
  };
}) {
  const { addItem } = useCart();
  const router = useRouter();

  function handleClick() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.image_url,
      priceUsd: product.price_usd,
      depositPct: product.deposit_pct,
    });
    router.push("/carrito");
  }

  return (
    <button onClick={handleClick} className="text-sm font-medium text-brand-600 hover:underline">
      ↻ Hacer pedido de nuevo
    </button>
  );
}
