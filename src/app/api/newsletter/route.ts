import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/admin";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.CONTACT_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://comecsa-store.netlify.app";

  if (!apiKey || !notifyTo) {
    return NextResponse.json({ error: "La suscripción no está configurada todavía." }, { status: 503 });
  }

  try {
    const json = await req.json();
    const data = bodySchema.parse(json);
    const admin = createAdminSupabase();

    const { data: existing } = await admin
      .from("newsletter_subscribers")
      .select("id, active, unsubscribe_token")
      .eq("email", data.email)
      .maybeSingle();

    let unsubscribeToken = existing?.unsubscribe_token as string | undefined;

    if (existing) {
      if (!existing.active) {
        await admin
          .from("newsletter_subscribers")
          .update({ active: true, unsubscribed_at: null })
          .eq("id", existing.id);
      }
    } else {
      const { data: created, error } = await admin
        .from("newsletter_subscribers")
        .insert({ email: data.email })
        .select("unsubscribe_token")
        .single();
      if (error) throw new Error(error.message);
      unsubscribeToken = created.unsubscribe_token;
    }

    // Aviso interno de nueva suscripción.
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "COMECSA Web <onboarding@resend.dev>",
        to: [notifyTo],
        reply_to: data.email,
        subject: "[Newsletter COMECSA] Nueva suscripción a promociones",
        html: `<p>Un visitante se suscribió a las promociones de la tienda web con el correo:</p><p><strong>${escapeHtml(data.email)}</strong></p>`,
      }),
    }).catch((err) => console.error("Resend admin notify error", err));

    // Bienvenida al suscriptor con su link para darse de baja.
    const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;
    const welcomeRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "COMECSA <onboarding@resend.dev>",
        to: [data.email],
        subject: "¡Listo! Ya estás suscrito a las promociones de COMECSA",
        html: `
          <p>¡Hola!</p>
          <p>Te suscribiste a las promociones de <strong>COMECSA</strong>. Desde ahora te avisaremos por este correo cuando tengamos ofertas y novedades.</p>
          <p style="margin-top:24px;font-size:12px;color:#888;">Si no quieres seguir recibiendo estos correos, puedes <a href="${unsubscribeUrl}">darte de baja aquí</a>.</p>
        `,
      }),
    });

    if (!welcomeRes.ok) {
      console.error("Resend welcome error", welcomeRes.status, await welcomeRes.text());
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
