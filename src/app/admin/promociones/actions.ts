"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/utils";
import type { DiscountType } from "@/types/database";

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

export async function createDiscountCode(formData: FormData) {
  const supabase = await createServerSupabase();

  const code = String(formData.get("code") || "").trim().toUpperCase();
  const type = String(formData.get("type") || "percentage") as DiscountType;
  const value = Number(formData.get("value") || 0);
  const usageLimitRaw = String(formData.get("usage_limit") || "").trim();
  const usage_limit = usageLimitRaw ? Math.max(1, Math.round(Number(usageLimitRaw))) : null;
  const expiresRaw = String(formData.get("expires_at") || "").trim();
  const expires_at = expiresRaw ? new Date(`${expiresRaw}T23:59:59`).toISOString() : null;
  const scope = String(formData.get("scope") || "all");
  const productIds = scope === "selected" ? (formData.getAll("product_ids") as string[]) : [];

  if (!code) throw new Error("Ingresa un código");
  if (!(value > 0)) throw new Error("Ingresa un valor de descuento válido");
  if (type === "percentage" && value > 100) throw new Error("El porcentaje no puede ser mayor a 100");
  if (scope === "selected" && productIds.length === 0) throw new Error("Selecciona al menos un producto o elige \"Todo el catálogo\"");

  const { data: created, error } = await supabase
    .from("discount_codes")
    .insert({ code, type, value, usage_limit, expires_at })
    .select("id")
    .single();
  if (error) throw new Error(error.message.includes("duplicate") ? "Ya existe un código con ese nombre" : error.message);

  if (productIds.length > 0) {
    const rows = productIds.map((pid) => ({ discount_code_id: created.id, product_id: pid }));
    const { error: linkError } = await supabase.from("discount_code_products").insert(rows);
    if (linkError) throw new Error(linkError.message);
  }

  revalidatePath("/admin/promociones");
}

export async function sendPersonalizedDiscount(formData: FormData) {
  const supabase = await createServerSupabase();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const customerName = String(formData.get("customer_name") || "").trim();
  const type = String(formData.get("type") || "percentage") as DiscountType;
  const value = Number(formData.get("value") || 0);
  const expiresRaw = String(formData.get("expires_at") || "").trim();
  const expires_at = expiresRaw ? new Date(`${expiresRaw}T23:59:59`).toISOString() : null;
  const scope = String(formData.get("scope") || "all");
  const productIds = scope === "selected" ? (formData.getAll("product_ids") as string[]) : [];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Ingresa un correo válido");
  if (!(value > 0)) throw new Error("Ingresa un valor de descuento válido");
  if (type === "percentage" && value > 100) throw new Error("El porcentaje no puede ser mayor a 100");
  if (scope === "selected" && productIds.length === 0) throw new Error("Selecciona al menos un producto o elige \"Todo el catálogo\"");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Falta configurar RESEND_API_KEY");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://comecsa-store.netlify.app";

  // Genera un código único, reintentando si por casualidad ya existe.
  let code = "";
  let createdId = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    code = `VIP${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data: created, error } = await supabase
      .from("discount_codes")
      .insert({ code, type, value, usage_limit: 1, expires_at, issued_to_email: email })
      .select("id")
      .single();
    if (!error && created) {
      createdId = created.id;
      break;
    }
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  }
  if (!createdId) throw new Error("No se pudo generar un código único, intenta de nuevo");

  let scopedProductNames: string[] = [];
  if (productIds.length > 0) {
    const { error: linkError } = await supabase
      .from("discount_code_products")
      .insert(productIds.map((pid) => ({ discount_code_id: createdId, product_id: pid })));
    if (linkError) throw new Error(linkError.message);

    const { data: scopedProducts } = await supabase.from("products").select("name").in("id", productIds);
    scopedProductNames = (scopedProducts || []).map((p) => p.name);
  }

  const discountLabel = type === "percentage" ? `${value}% de descuento` : `${formatUSD(value)} de descuento`;
  const scopeLabel = scopedProductNames.length > 0 ? `en: ${scopedProductNames.join(", ")}` : "en toda la tienda";

  const html = `
    <p>¡Hola${customerName ? ` ${escapeHtml(customerName)}` : ""}!</p>
    <p>Tenemos un código exclusivo para ti: <strong>${discountLabel}</strong> ${escapeHtml(scopeLabel)}.</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:2px;background:#f2f0fa;color:#2D1B69;padding:12px 20px;border-radius:8px;display:inline-block;">${code}</p>
    <p>Ingresa este código en el carrito de <a href="${siteUrl}">${siteUrl}</a> antes de pagar.</p>
    ${expires_at ? `<p style="font-size:13px;color:#888;">Válido hasta el ${new Date(expires_at).toLocaleDateString("es-EC")}.</p>` : ""}
    <p style="font-size:13px;color:#888;">Este código es personal, de un solo uso.</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "COMECSA <onboarding@resend.dev>",
      to: [email],
      subject: "Tu código de descuento personal — COMECSA",
      html,
    }),
  });

  if (!res.ok) {
    console.error("Resend personalized discount error", res.status, await res.text());
    throw new Error("El código se creó pero no se pudo enviar el correo. Revisa la configuración de Resend.");
  }

  revalidatePath("/admin/promociones");
}

export async function toggleDiscountCode(formData: FormData) {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";
  const { error } = await supabase.from("discount_codes").update({ active: !active }).eq("id", id);
  if (error) throw new Error(error.message);
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
