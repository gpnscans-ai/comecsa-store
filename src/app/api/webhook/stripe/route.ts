import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature error", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const orderPayments: { order_id: string; amount: number }[] = JSON.parse(
      session.metadata?.order_payments || "[]"
    );

    const supabase = createAdminSupabase();

    for (const { order_id, amount } of orderPayments) {
      await supabase.from("payments").insert({
        order_id,
        amount,
        method: "stripe",
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
      });

      await supabase.from("orders").update({ status: "confirmado" }).eq("id", order_id);
    }
  }

  return NextResponse.json({ received: true });
}
