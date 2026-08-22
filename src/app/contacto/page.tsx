"use client";

import { useState } from "react";
import Header from "@/components/store/Header";
import WhatsAppButton from "@/components/store/WhatsAppButton";

export default function ContactoPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar");
      setStatus("sent");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="font-display text-2xl font-bold">Contáctanos</h1>
        <p className="mt-1 text-sm text-ink-700/60">
          ¿Preguntas sobre un producto, un pedido o algo más? Escríbenos y te respondemos por correo.
        </p>

        {status === "sent" ? (
          <div className="card mt-6 p-6 text-center">
            <p className="text-3xl">📨</p>
            <p className="mt-2 font-semibold">¡Mensaje enviado!</p>
            <p className="text-sm text-ink-700/70">Te responderemos pronto a tu correo.</p>
          </div>
        ) : (
          <form action={handleSubmit} className="card mt-6 space-y-4 p-6">
            <div>
              <label className="label" htmlFor="name">Nombre *</label>
              <input className="input" id="name" name="name" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="email">Correo *</label>
                <input className="input" id="email" name="email" type="email" required />
              </div>
              <div>
                <label className="label" htmlFor="phone">Teléfono</label>
                <input className="input" id="phone" name="phone" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="subject">Asunto *</label>
              <input className="input" id="subject" name="subject" required />
            </div>
            <div>
              <label className="label" htmlFor="message">Mensaje *</label>
              <textarea className="input" id="message" name="message" rows={5} required />
            </div>

            {status === "error" && <p className="text-sm text-red-400">{errorMsg}</p>}

            <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
              {status === "loading" ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>
        )}
      </main>
      <WhatsAppButton />
    </div>
  );
}
