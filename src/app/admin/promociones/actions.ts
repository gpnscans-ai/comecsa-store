"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function sendPromotion(formData: FormData) {
  const supabase = await createServerSupabase();

  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!subject || !body) throw new Error("Completa el asunto y el mensaje");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Falta configurar RESEND_API_KEY");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://comecsa-store.netlify.app";

  const { data: subscribers, error: subsError } = await supabase
    .from("newsletter_subscribers")
    .select("email, unsubscribe_token")
    .eq("active", true);
  if (subsError) throw new Error(subsError.message);

  const list = subscribers || [];
  let sent = 0;

  // Se envía en lotes de hasta 100 (límite de la API de batch de Resend) para
  // evitar cientos de llamadas secuenciales y el timeout de la función serverless.
  const CHUNK_SIZE = 100;
  for (let i = 0; i < list.length; i += CHUNK_SIZE) {
    const chunk = list.slice(i, i + CHUNK_SIZE);
    const payload = chunk.map((sub) => {
      const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`;
      return {
        from: "COMECSA <onboarding@resend.dev>",
        to: [sub.email],
        subject,
        html: `
          <div>${escapeHtml(body).replace(/\n/g, "<br/>")}</div>
          <p style="margin-top:24px;font-size:12px;color:#888;">Recibiste este correo porque estás suscrito a las promociones de COMECSA. <a href="${unsubscribeUrl}">Darte de baja</a>.</p>
        `,
      };
    });

    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        sent += Array.isArray(json?.data) ? json.data.length : chunk.length;
      } else {
        console.error("Resend batch campaign error", res.status, await res.text());
      }
    } catch (err) {
      console.error("Resend batch campaign fetch error", err);
    }
  }

  const { error: campaignError } = await supabase
    .from("newsletter_campaigns")
    .insert({ subject, body, recipients_count: sent });
  if (campaignError) throw new Error(campaignError.message);

  revalidatePath("/admin/promociones");
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
