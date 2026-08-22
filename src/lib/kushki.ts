// Integración con Kushki (pasarela de pagos para Ecuador/LatAm).
// Docs de referencia: https://docs.kushkipagos.com/
//
// IMPORTANTE: esta integración se escribió sin poder probarla contra una
// cuenta real de Kushki (el negocio todavía no la tenía al momento de
// programarla). Antes de usarla en producción hay que probarla en el
// entorno de pruebas (sandbox/UAT) de Kushki con una tarjeta de prueba,
// igual que se hizo con Stripe, Gemini y Resend en este proyecto.

const KUSHKI_BASE_URL =
  process.env.NEXT_PUBLIC_KUSHKI_ENV === "production"
    ? "https://api.kushkipagos.com"
    : "https://api-uat.kushkipagos.com";

export function isKushkiConfigured() {
  return Boolean(process.env.KUSHKI_PRIVATE_MERCHANT_ID && process.env.NEXT_PUBLIC_KUSHKI_PUBLIC_MERCHANT_ID);
}

interface KushkiChargeResult {
  ok: boolean;
  ticketNumber?: string;
  error?: string;
}

// Cobra una tarjeta ya tokenizada en el navegador (ver KushkiCardForm.tsx).
export async function chargeKushkiToken(token: string, amountUsd: number): Promise<KushkiChargeResult> {
  const privateMerchantId = process.env.KUSHKI_PRIVATE_MERCHANT_ID;
  if (!privateMerchantId) {
    return { ok: false, error: "Kushki no está configurado en el servidor" };
  }

  try {
    const res = await fetch(`${KUSHKI_BASE_URL}/card/v1/charges`, {
      method: "POST",
      headers: {
        "Private-Merchant-Id": privateMerchantId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        amount: {
          subtotalIva: 0,
          subtotalIva0: Math.round(amountUsd * 100) / 100,
          ivaValue: 0,
          currency: "USD",
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data?.message || `Kushki rechazó el cobro (HTTP ${res.status})` };
    }

    return { ok: true, ticketNumber: data.ticketNumber };
  } catch (err: any) {
    return { ok: false, error: err.message || "Error de red al contactar a Kushki" };
  }
}
