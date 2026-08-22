"use client";

import { useEffect, useState } from "react";
import { formatUSD } from "@/lib/utils";

declare global {
  interface Window {
    Kushki?: any;
  }
}

const KUSHKI_SCRIPT_SRC = "https://cdn.kushkipagos.com/kushki.js";

export default function KushkiCardForm({
  amount,
  onToken,
  disabled,
}: {
  amount: number;
  onToken: (token: string) => void;
  disabled?: boolean;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (window.Kushki) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = KUSHKI_SCRIPT_SRC;
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError("No se pudo cargar la pasarela de pagos. Intenta de nuevo o usa WhatsApp.");
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!scriptReady || !window.Kushki) {
      setError("La pasarela de pagos todavía está cargando, espera unos segundos.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const kushki = new window.Kushki({
        merchantId: process.env.NEXT_PUBLIC_KUSHKI_PUBLIC_MERCHANT_ID,
        inTestEnvironment: process.env.NEXT_PUBLIC_KUSHKI_ENV !== "production",
      });

      kushki.requestToken(
        {
          card: { name, number: number.replace(/\s+/g, ""), cvc, expiryMonth, expiryYear },
          currency: "USD",
          amount: { subtotalIva: 0, subtotalIva0: amount, ivaValue: 0 },
        },
        (response: any) => {
          setLoading(false);
          if (response?.code) {
            setError(response.message || "La tarjeta fue rechazada, verifica los datos.");
            return;
          }
          if (response?.token) {
            onToken(response.token);
          } else {
            setError("No se pudo procesar la tarjeta. Intenta de nuevo.");
          }
        }
      );
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Error al procesar la tarjeta");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="kushki_name">Nombre en la tarjeta</label>
        <input className="input" id="kushki_name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="kushki_number">Número de tarjeta</label>
        <input
          className="input"
          id="kushki_number"
          inputMode="numeric"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="4242 4242 4242 4242"
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label" htmlFor="kushki_mm">Mes</label>
          <input className="input" id="kushki_mm" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} placeholder="MM" maxLength={2} required />
        </div>
        <div>
          <label className="label" htmlFor="kushki_yy">Año</label>
          <input className="input" id="kushki_yy" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} placeholder="AA" maxLength={2} required />
        </div>
        <div>
          <label className="label" htmlFor="kushki_cvc">CVC</label>
          <input className="input" id="kushki_cvc" value={cvc} onChange={(e) => setCvc(e.target.value)} maxLength={4} required />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={loading || disabled || !scriptReady} className="btn-primary w-full">
        {loading ? "Procesando..." : !scriptReady ? "Cargando pasarela..." : `Pagar ${formatUSD(amount)}`}
      </button>
    </form>
  );
}
