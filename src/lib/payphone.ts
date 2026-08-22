// Integración con PayPhone (Botón de Pago) — https://docs.payphone.app/boton-de-pago
//
// IMPORTANTE: igual que con Kushki, esto se escribió sin poder probarlo contra
// una cuenta real de PayPhone (el negocio todavía no tenía el token al momento
// de programarlo). Antes de usarla en producción hay que:
//   1. Confirmar los nombres exactos de los campos contra la documentación
//      actual (docs.payphone.app/boton-de-pago), pueden cambiar con el tiempo.
//   2. Registrar la URL de retorno (responseUrl) en el panel de PayPhone si
//      lo piden ahí en vez de (o además de) mandarla en cada request.
//   3. Hacer una compra de prueba real en su ambiente de pruebas.

const PAYPHONE_BASE_URL = "https://pay.payphonetodoesposible.com/api";

export function isPayphoneConfigured() {
  return Boolean(process.env.PAYPHONE_TOKEN);
}

interface PrepareResult {
  ok: boolean;
  url?: string;
  error?: string;
}

// Fase 1: prepara la transacción y devuelve la URL a la que hay que redirigir al cliente.
export async function preparePayphoneTransaction(params: {
  amountUsd: number;
  clientTransactionId: string; // usar el id de nuestra tabla checkout_sessions
  reference: string;
  responseUrl: string;
}): Promise<PrepareResult> {
  const token = process.env.PAYPHONE_TOKEN;
  if (!token) return { ok: false, error: "PayPhone no está configurado en el servidor" };

  const amountCents = Math.round(params.amountUsd * 100);

  try {
    const res = await fetch(`${PAYPHONE_BASE_URL}/button/Prepare`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountCents,
        amountWithoutTax: amountCents,
        amountWithTax: 0,
        tax: 0,
        service: 0,
        tip: 0,
        currency: "USD",
        reference: params.reference.slice(0, 100),
        clientTransactionId: params.clientTransactionId,
        storeId: process.env.PAYPHONE_STORE_ID || undefined,
        responseUrl: params.responseUrl,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data?.message || data?.errors?.[0]?.message || `PayPhone rechazó la preparación (HTTP ${res.status})` };
    }

    const url = data.payWithCard || data.payWithPayPhoneAccount || data.url;
    if (!url) return { ok: false, error: "PayPhone no devolvió un link de pago" };

    return { ok: true, url };
  } catch (err: any) {
    return { ok: false, error: err.message || "Error de red al contactar a PayPhone" };
  }
}

interface ConfirmResult {
  ok: boolean;
  approved: boolean;
  error?: string;
}

// Fase 2: confirma la transacción cuando el cliente vuelve del formulario de PayPhone.
export async function confirmPayphoneTransaction(id: string, clientTransactionId: string): Promise<ConfirmResult> {
  const token = process.env.PAYPHONE_TOKEN;
  if (!token) return { ok: false, approved: false, error: "PayPhone no está configurado en el servidor" };

  try {
    const res = await fetch(`${PAYPHONE_BASE_URL}/button/V2/Confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: Number(id), clientTxId: clientTransactionId }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, approved: false, error: data?.message || `HTTP ${res.status}` };
    }

    const approved = data.transactionStatus === "Approved" || data.statusCode === 3;
    return { ok: true, approved };
  } catch (err: any) {
    return { ok: false, approved: false, error: err.message || "Error de red al confirmar con PayPhone" };
  }
}
