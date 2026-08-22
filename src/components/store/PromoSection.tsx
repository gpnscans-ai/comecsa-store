"use client";

import { useState } from "react";

export default function PromoSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "No se pudo completar la suscripción");
        return;
      }

      setStatus("ok");
      setMessage("¡Listo! Te avisaremos de nuestras promociones.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Error de conexión, intenta de nuevo");
    }
  }

  return (
    <section className="bg-brand-700 py-16 text-center text-white">
      <div className="mx-auto max-w-xl px-4">
        <h2 className="text-3xl font-bold sm:text-4xl">Promociones Especiales</h2>
        <p className="mt-2 text-white/80">Descubre nuestras mejores ofertas</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <h3 className="text-lg font-medium">Suscríbete aquí y recibe nuestras promociones</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu correo electrónico"
              className="w-full max-w-sm rounded-full border-0 px-5 py-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-white sm:w-80"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-white px-10 py-3 font-semibold text-brand-600 shadow-lg transition hover:bg-white/90 disabled:opacity-60"
            >
              {status === "loading" ? "Enviando..." : "Suscribirme"}
            </button>
          </div>
          {message && (
            <p className={`text-sm ${status === "error" ? "text-red-200" : "text-white/90"}`}>{message}</p>
          )}
        </form>
      </div>
    </section>
  );
}
