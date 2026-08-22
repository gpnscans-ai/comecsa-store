import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { confirmPayphoneTransaction } from "@/lib/payphone";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { searchParams } = new URL(req.url);

  // PayPhone redirige con estos parámetros en la query string tras el pago.
  const id = searchParams.get("id");
  const clientTransactionId = searchParams.get("clientTransactionId");

  if (!id || !clientTransactionId) {
    return NextResponse.redirect(`${siteUrl}/carrito?error=payphone_invalid`);
  }

  const supabase = createAdminSupabase();

  const { data: session } = await supabase
    .from("checkout_sessions")
    .select("*")
    .eq("id", clientTransactionId)
    .eq("provider", "payphone")
    .maybeSingle();

  if (!session || session.status !== "pending") {
    return NextResponse.redirect(`${siteUrl}/carrito?error=payphone_session`);
  }

  const confirmation = await confirmPayphoneTransaction(id, clientTransactionId);

  if (!confirmation.ok || !confirmation.approved) {
    await supabase.from("checkout_sessions").update({ status: "failed", payphone_transaction_id: id }).eq("id", session.id);
    return NextResponse.redirect(`${siteUrl}/carrito?error=payphone_rejected`);
  }

  const orderPayments = (session.order_payments || []) as { order_id: string; amount: number }[];

  for (const o of orderPayments) {
    await supabase.from("payments").insert({
      order_id: o.order_id,
      amount: o.amount,
      method: "payphone",
      stripe_session_id: `payphone:${id}`,
    });
    await supabase.from("orders").update({ status: "confirmado" }).eq("id", o.order_id);
  }

  await supabase.from("checkout_sessions").update({ status: "completed", payphone_transaction_id: id }).eq("id", session.id);

  return NextResponse.redirect(`${siteUrl}/reserva-confirmada`);
}
