import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional().or(z.literal("")),
  subject: z.string().min(1).max(150),
  message: z.string().min(1).max(3000),
});

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;

  if (!apiKey || !to) {
    return NextResponse.json({ error: "El formulario de contacto no está configurado todavía." }, { status: 503 });
  }

  try {
    const json = await req.json();
    const data = bodySchema.parse(json);

    const html = `
      <h2>Nuevo mensaje desde la tienda web de COMECSA</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Correo:</strong> ${escapeHtml(data.email)}</p>
      ${data.phone ? `<p><strong>Teléfono:</strong> ${escapeHtml(data.phone)}</p>` : ""}
      <p><strong>Asunto:</strong> ${escapeHtml(data.subject)}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${escapeHtml(data.message).replace(/\n/g, "<br/>")}</p>
    `;

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
        subject: `[Contacto COMECSA] ${data.subject}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error", res.status, errText);
      return NextResponse.json({ error: "No se pudo enviar el mensaje" }, { status: 502 });
    }

    // Correo de confirmación automático para quien llenó el formulario.
    const confirmationHtml = `
      <p>¡Hola ${escapeHtml(data.name)}!</p>
      <p>Recibimos tu mensaje sobre "<strong>${escapeHtml(data.subject)}</strong>" y te vamos a responder pronto por este mismo correo.</p>
      <p>Este es un resumen de lo que nos escribiste:</p>
      <blockquote style="border-left:3px solid #2D1B69;margin:0;padding-left:12px;color:#555;">
        ${escapeHtml(data.message).replace(/\n/g, "<br/>")}
      </blockquote>
      <p style="margin-top:16px;">— COMECSA 🛍️</p>
    `;

    const confirmationRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "COMECSA <onboarding@resend.dev>",
        to: [data.email],
        subject: "Recibimos tu mensaje — COMECSA",
        html: confirmationHtml,
      }),
    });

    if (!confirmationRes.ok) {
      // No falla el envío principal si solo el correo de confirmación no se pudo mandar.
      console.error("Resend confirmation error", confirmationRes.status, await confirmationRes.text());
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.issues) {
      return NextResponse.json({ error: "Revisa los datos del formulario" }, { status: 400 });
    }
    console.error("contact route error", err);
    return NextResponse.json({ error: "Error al enviar el mensaje" }, { status: 500 });
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
