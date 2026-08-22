import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const token = searchParams.get("token");

  if (token) {
    const admin = createAdminSupabase();
    await admin
      .from("newsletter_subscribers")
      .update({ active: false, unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", token);
  }

  return NextResponse.redirect(new URL("/desuscrito", origin));
}
