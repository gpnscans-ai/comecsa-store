"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/store/Header";

export default function DesuscritoPage() {
  useEffect(() => {
    // El link de baja llega con un token ya usado; se limpia de la barra de
    // direcciones (Netlify lo reenvía en el redirect pese a mandarlo limpio).
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">👋</p>
        <h1 className="mt-4 font-display text-2xl font-bold">Listo, te diste de baja</h1>
        <p className="mt-2 text-ink-700/70">
          Ya no recibirás más correos de promociones de COMECSA. Si cambias de opinión, puedes suscribirte de nuevo desde la página principal.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">Volver a la tienda</Link>
      </main>
    </div>
  );
}
