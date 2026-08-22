import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;

  if (!apiKey || !to) {
    return NextResponse.json({ error: "La suscripción no está configurada todavía." }, { status: 503 });
  }

  try {
    const json = await req.json();
    const data = bodySchema.parse(json);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "COMECSA Web <onboarding@resend.dev>",
        to: [to],
        reply_to: data.email,
        subject: "[Newsletter COMECSA] Nueva suscripción a promociones",
        html: `<p>Un visitante se suscribió a las promociones de la tienda web con el correo:</p><p><strong>${escapeHtml(data.email)}</strong></p>`,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend newsletter error", res.status, errText);
      return NextResponse.json({ error: "No se pudo registrar la suscripción" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: "Ingresa un correo electrónico válido" }, { status: 400 });
    }
    console.error("newsletter route error", err);
    return NextResponse.json({ error: "Error al procesar la suscripción" }, { status: 500 });
  }
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
