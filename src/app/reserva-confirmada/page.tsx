"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/store/Header";
import { useCart } from "@/components/store/CartContext";

export default function ReservaConfirmadaPage() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-4 font-display text-2xl font-bold">¡Pedido confirmado!</h1>
        <p className="mt-2 text-ink-700/70">
          Recibimos tu pedido y tu abono. Te contactaremos por WhatsApp para coordinar el retiro en tienda o el envío a domicilio.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">Seguir comprando</Link>
      </main>
    </div>
  );
}
