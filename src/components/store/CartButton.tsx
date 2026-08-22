"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export default function CartButton() {
  const { count } = useCart();
  return (
    <Link href="/carrito" className="relative flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 hover:bg-ink-100">
      🛒 <span className="hidden sm:inline">Carrito</span>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
