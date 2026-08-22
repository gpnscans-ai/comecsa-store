import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string" || !/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "Pega una URL válida (http/https)" }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    const html = await res.text();
    const looksLikeBotChallenge =
      /just a moment|checking your browser|cf-challenge|attention required.*cloudflare/i.test(html);

    if (!res.ok || looksLikeBotChallenge) {
      if (looksLikeBotChallenge || res.status === 403) {
        return NextResponse.json(
          {
            error:
              "Este sitio bloquea la lectura automática (protección anti-bots tipo Cloudflare). No hay forma de saltarla — copia los datos a mano desde la página.",
          },
          { status: 502 }
        );
      }
      return NextResponse.json({ error: `La página respondió con error (HTTP ${res.status})` }, { status: 502 });
    }

    const $ = cheerio.load(html);

    const meta = (name: string) =>
      $(`meta[property="${name}"]`).attr("content") || $(`meta[name="${name}"]`).attr("content") || "";

    let name = meta("og:title") || $("title").first().text() || "";
    name = name.replace(/\s+/g, " ").trim().slice(0, 200);

    let description = meta("og:description") || meta("description") || "";
    description = description.replace(/\s+/g, " ").trim().slice(0, 1000);

    let image = meta("og:image") || $("img").first().attr("src") || "";
    if (image && !/^https?:\/\//.test(image)) {
      try {
        image = new URL(image, url).toString();
      } catch {
        image = "";
      }
    }

    return NextResponse.json({
      name,
      description,
      image_url: image,
      source_url: url,
    });
  } catch (err: any) {
    console.error("import-product error", err);
    return NextResponse.json({ error: "No se pudo leer esa página. Copia los datos a mano." }, { status: 500 });
  }
}
