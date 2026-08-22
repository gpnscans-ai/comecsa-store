import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { chargeKushkiToken, isKushkiConfigured } from "@/lib/kushki";
import { preparePayphoneTransaction, isPayphoneConfigured } from "@/lib/payphone";
import { validateDiscountCode } from "@/lib/discounts";
import { computeCartPricing, getEffectiveUnitPrice } from "@/lib/promo";
import { withIva, DEFAULT_IVA_PCT } from "@/lib/tax";

// Precios fijos de envío definidos por el negocio (no se confía en el valor que mande el cliente).
const DELIVERY_COSTS: Record<"retiro_tienda" | "domicilio", { cost: number; label: string }> = {
  retiro_tienda: { cost: 0, label: "Retiro en tienda (La Libertad)" },
  domicilio: { cost: 3, label: "Envío a domicilio" },
};

const bodySchema = z.object({
  customer: z.object({
    full_name: z.string().min(1),
    whatsapp: z.string().min(6),
    email: z.string().email().optional().or(z.literal("")).nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        name: z.string().min(1),
        priceUsd: z.number().positive(),
        depositPct: z.number().min(0).max(100),
        quantity: z.number().int().positive().max(20),
        promoType: z.literal("2x1").optional().nullable(),
      })
    )
    .min(1),
  delivery: z
    .object({
      type: z.enum(["retiro_tienda", "domicilio"]),
      cost: z.number().min(0).max(50),
      label: z.string().min(1),
    })
    .optional()
    .nullable(),
  kushkiToken: z.string().optional().nullable(),
  discountCode: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { customer, items, delivery, kushkiToken, discountCode } = bodySchema.parse(json);

    const supabase = createAdminSupabase();

    const { data: businessSettings } = await supabase.from("business_settings").select("iva_pct").eq("id", 1).maybeSingle();
    const ivaPct = businessSettings?.iva_pct != null ? Number(businessSettings.iva_pct) : DEFAULT_IVA_PCT;

    // El precio y si el producto es 2x1 se leen del catálogo real, NUNCA del valor que
    // manda el navegador (evita que alguien fuerce un precio menor o un 2x1 inventado).
    const productIds = [...new Set(items.map((i) => i.productId))];
    const { data: dbProducts } = await supabase
      .from("products")
      .select("id, price_usd, promo_active, promo_type, promo_value")
      .in("id", productIds);
    const productMap = new Map((dbProducts || []).map((p) => [p.id, p]));

    const pricedItems = items.map((i) => {
      const dbProduct = productMap.get(i.productId);
      if (!dbProduct) return i;
      return {
        ...i,
        priceUsd: getEffectiveUnitPrice(dbProduct),
        promoType: dbProduct.promo_active && dbProduct.promo_type === "2x1" ? ("2x1" as const) : null,
      };
    });

    // 2x1 se calcula una sola vez para todo el carrito: se emparejan TODAS las
    // unidades marcadas 2x1 sin importar el producto, y en cada par se paga la más
    // cara mientras la más barata (o igual) sale gratis.
    const pricing = computeCartPricing(pricedItems);

    // El descuento se valida y calcula en servidor; nunca se confía en un monto que mande el cliente.
    // Solo se aplica a los productos elegibles del código (appliesToProductIds === null significa "todos").
    let appliedDiscount: { code: string; appliesToProductIds: string[] | null; factor: number } | null = null;

    if (discountCode) {
      const result = await validateDiscountCode(
        discountCode,
        pricedItems.map((i, idx) => ({ productId: i.productId, priceUsd: i.priceUsd, quantity: pricing.payableCount[idx] }))
      );
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      const factor = result.eligibleSubtotal > 0 ? 1 - result.discountAmount / result.eligibleSubtotal : 1;
      appliedDiscount = { code: result.code, appliesToProductIds: result.appliesToProductIds, factor };
    }

    function priceForItem(priceUsd: number, productId: string) {
      if (!appliedDiscount) return priceUsd;
      const isEligible = appliedDiscount.appliesToProductIds === null || appliedDiscount.appliesToProductIds.includes(productId);
      return isEligible ? Math.round(priceUsd * appliedDiscount.factor * 100) / 100 : priceUsd;
    }

    // Si el comprador tiene sesión iniciada, ligamos el pedido a SU cuenta real
    // (nunca se confía en un customerId que mande el cliente en el body).
    const sessionSupabase = await createServerSupabase();
    const {
      data: { user },
    } = await sessionSupabase.auth.getUser();

    let customerId: string | undefined;

    if (user) {
      const { data: ownCustomer } = await supabase.from("customers").select("id").eq("user_id", user.id).maybeSingle();
      customerId = ownCustomer?.id;
    }

    // Si no hay sesión (o no tiene fila de cliente todavía), busca/crea por WhatsApp como invitado.
    if (!customerId) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("whatsapp", customer.whatsapp)
        .maybeSingle();
      customerId = existing?.id;
    }

    if (!customerId) {
      const { data: created, error: customerError } = await supabase
        .from("customers")
        .insert({
          full_name: customer.full_name,
          whatsapp: customer.whatsapp,
          email: customer.email || null,
          address: customer.address || null,
          city: customer.city || null,
          channel: "tienda",
        })
        .select("id")
        .single();
      if (customerError) throw new Error(customerError.message);
      customerId = created.id;
    }

    const orderIds: { orderId: string; depositAmount: number; name: string }[] = [];

    for (let itemIdx = 0; itemIdx < pricedItems.length; itemIdx++) {
      const item = pricedItems[itemIdx];
      for (let i = 0; i < item.quantity; i++) {
        const isFreeUnit = pricing.freeMap[itemIdx][i];
        // El precio guardado en la orden ya incluye IVA: es lo que realmente se cobra
        // y contra lo que se calculan abonos y saldos pendientes en todo el admin.
        const unitPrice = isFreeUnit ? 0 : withIva(priceForItem(item.priceUsd, item.productId), ivaPct);

        const notes = [
          isFreeUnit ? "Unidad gratis (promo 2x1)" : null,
          appliedDiscount ? `Código de descuento aplicado: ${appliedDiscount.code}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || null;

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            customer_id: customerId,
            product_id: item.productId,
            item_name: item.name,
            price_usd: unitPrice,
            status: "pendiente",
            source: "web",
            internal_notes: notes,
          })
          .select("id")
          .single();
        if (orderError) throw new Error(orderError.message);

        const depositAmount = Math.round(((unitPrice * item.depositPct) / 100) * 100) / 100;
        orderIds.push({ orderId: order.id, depositAmount, name: item.name });
      }
    }

    if (appliedDiscount) {
      await supabase.rpc("increment_discount_usage", { p_code: appliedDiscount.code });
    }

    if (delivery) {
      const authoritative = DELIVERY_COSTS[delivery.type];
      const shippingPriceWithIva = withIva(authoritative.cost, ivaPct);
      const { data: shippingOrder, error: shippingError } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          product_id: null,
          item_name: `Envío - ${authoritative.label}`,
          price_usd: shippingPriceWithIva,
          status: "pendiente",
          source: "web",
        })
        .select("id")
        .single();
      if (shippingError) throw new Error(shippingError.message);

      // El envío se cobra completo (100%) en el checkout, no como abono.
      orderIds.push({ orderId: shippingOrder.id, depositAmount: shippingPriceWithIva, name: `Envío - ${authoritative.label}` });
    }

    const totalToCharge = Math.round(orderIds.reduce((s, o) => s + o.depositAmount, 0) * 100) / 100;

    // --- Kushki: cobro síncrono con el token generado en el navegador ---
    if (isKushkiConfigured() && kushkiToken) {
      const result = await chargeKushkiToken(kushkiToken, totalToCharge);
      if (!result.ok) {
        return NextResponse.json({ error: result.error || "El pago con Kushki fue rechazado" }, { status: 402 });
      }

      for (const o of orderIds) {
        await supabase.from("payments").insert({
          order_id: o.orderId,
          amount: o.depositAmount,
          method: "kushki",
          stripe_session_id: result.ticketNumber ? `kushki:${result.ticketNumber}` : null,
        });
        await supabase.from("orders").update({ status: "confirmado" }).eq("id", o.orderId);
      }

      return NextResponse.json({ url: null, ok: true });
    }

    // --- PayPhone: checkout hospedado con redirección (si Kushki no está configurado) ---
    if (isPayphoneConfigured()) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      const { data: session, error: sessionError } = await supabase
        .from("checkout_sessions")
        .insert({
          provider: "payphone",
          order_payments: orderIds.map((o) => ({ order_id: o.orderId, amount: o.depositAmount })),
          total: totalToCharge,
          status: "pending",
        })
        .select("id")
        .single();
      if (sessionError) throw new Error(sessionError.message);

      const prepared = await preparePayphoneTransaction({
        amountUsd: totalToCharge,
        clientTransactionId: session.id,
        reference: `COMECSA - ${orderIds.map((o) => o.name).join(", ")}`.slice(0, 100),
        responseUrl: `${siteUrl}/api/payphone/callback`,
      });

      if (!prepared.ok) {
        return NextResponse.json({ error: prepared.error || "No se pudo iniciar el pago con PayPhone" }, { status: 502 });
      }

      return NextResponse.json({ url: prepared.url });
    }

    // --- Stripe: checkout hospedado (usado si Kushki/PayPhone no están configurados) ---
    const hasStripe = !!process.env.STRIPE_SECRET_KEY;

    if (!hasStripe) {
      return NextResponse.json({ url: null, orderIds: orderIds.map((o) => o.orderId) });
    }

    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: orderIds.map((o) => ({
        price_data: {
          currency: "usd",
          product_data: { name: `Abono - ${o.name}` },
          unit_amount: Math.round(o.depositAmount * 100),
        },
        quantity: 1,
      })),
      success_url: `${siteUrl}/reserva-confirmada?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/carrito`,
      customer_email: customer.email || undefined,
      metadata: {
        order_payments: JSON.stringify(orderIds.map((o) => ({ order_id: o.orderId, amount: o.depositAmount }))),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("checkout error", err);
    return NextResponse.json({ error: err.message || "Error al procesar la reserva" }, { status: 400 });
  }
}
