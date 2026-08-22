import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "El chatbot no está configurado todavía." }, { status: 503 });
  }

  const { messages } = (await req.json()) as { messages: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data: products } = await supabase
    .from("products")
    .select("name, slug, category, status, price_usd, deposit_pct, sizes")
    .eq("is_published", true)
    .neq("status", "archivado")
    .limit(40);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://comecsa-store.netlify.app";

  const catalogo = (products || [])
    .map(
      (p: any) =>
        `- ${p.name} | categoría: ${p.category} | estado: ${p.status} | precio: $${p.price_usd} | abono para apartar: ${p.deposit_pct}%${p.sizes ? ` | tallas: ${p.sizes}` : ""} | link: ${siteUrl}/productos/${p.slug}`
    )
    .join("\n");

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  const systemPrompt = `Eres el asistente de ventas de COMECSA, una tienda ecuatoriana de ropa, calzado, accesorios y artículos para el hogar en La Libertad, Santa Elena. Tu trabajo es ayudar a vender: ofrece productos del catálogo de forma proactiva, no solo esperes a que pregunten.
Reglas:
- Responde siempre en español, de forma breve, amigable y directa (2-4 frases máximo).
- El catálogo de abajo trae el link real de cada producto (campo "link"). Cuando el cliente pida el link, pregunte por un producto o quiera verlo, DALE ese link directo — nunca digas que no tienes enlaces, sí los tienes.
- Da precios, tallas y explica que se puede apartar con un abono (ver "abono para apartar") y pagar el resto al retirar o recibir el pedido.
- Si preguntan por algo que claramente NO está en el catálogo, o quieren coordinar pago, envío, reclamo o algo muy personalizado, ahí sí dile que escriba por WhatsApp al ${whatsapp ? `+${whatsapp}` : "número de contacto de la tienda"}. Usa esto como último recurso, no como respuesta por defecto.
- No inventes precios, links ni disponibilidad que no estén en el catálogo de abajo.
- No pidas ni proceses datos de tarjetas o pagos por chat.

Catálogo actual publicado (nombre | categoría | estado | precio | abono | tallas | link):
${catalogo || "(sin productos publicados por ahora)"}`;

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Entendido, listo para ayudar a los clientes de COMECSA." }] },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.slice(0, 2000) }],
    })),
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini error", res.status, errText);
      return NextResponse.json({ error: "No se pudo contactar al asistente" }, { status: 502 });
    }

    const data = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ||
      "Perdón, no pude generar una respuesta. Intenta de nuevo.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("chat route error", err);
    return NextResponse.json({ error: "Error del asistente" }, { status: 500 });
  }
}
