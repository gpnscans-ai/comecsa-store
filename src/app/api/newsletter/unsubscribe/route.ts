import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (token) {
    const admin = createAdminSupabase();
    await admin
      .from("newsletter_subscribers")
      .update({ active: false, unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token);
  }

  // Location relativo sin query string: en el runtime de Netlify,
  // NextResponse.redirect(new URL(...)) arrastraba el token original a la URL final.
  return new Response(null, { status: 302, headers: { Location: "/desuscrito" } });
}
