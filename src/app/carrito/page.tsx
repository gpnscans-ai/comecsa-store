"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/store/Header";
import { useCart } from "@/components/store/CartContext";
import { formatUSD } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import KushkiCardForm from "@/components/store/KushkiCardForm";

const DELIVERY_OPTIONS = {
  retiro_tienda: { label: "Retiro en tienda (La Libertad)", cost: 0 },
  domicilio: { label: "Envío a domicilio", cost: 3 },
} as const;

type DeliveryType = keyof typeof DELIVERY_OPTIONS;

const KUSHKI_ENABLED = Boolean(process.env.NEXT_PUBLIC_KUSHKI_PUBLIC_MERCHANT_ID);

export default function CarritoPage() {
  const { items, setQuantity, removeItem, totalPrice, totalDeposit } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryType>("retiro_tienda");
  const [paymentMode, setPaymentMode] = useState<"abono" | "completo">("abono");

  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: "percentage" | "fixed";
    value: number;
    appliesToProductIds: string[] | null;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session) return;
      const { data: own } = await supabase
        .from("customers")
        .select("full_name, whatsapp, email, city, address")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!own) return;
      setFullName((v) => v || own.full_name || "");
      setWhatsapp((v) => v || own.whatsapp || "");
      setEmail((v) => v || own.email || "");
      setCity((v) => v || own.city || "");
      setAddress((v) => v || own.address || "");
    });
  }, []);

  const deliveryCost = DELIVERY_OPTIONS[delivery].cost;

  const eligibleItems = appliedDiscount
    ? appliedDiscount.appliesToProductIds === null
      ? items
      : items.filter((i) => appliedDiscount.appliesToProductIds!.includes(i.productId))
    : [];
  const eligibleSubtotal = eligibleItems.reduce((s, i) => s + i.priceUsd * i.quantity, 0);

  const discountAmount = appliedDiscount
    ? appliedDiscount.type === "percentage"
      ? Math.round(eligibleSubtotal * (appliedDiscount.value / 100) * 100) / 100
      : Math.min(appliedDiscount.value, eligibleSubtotal)
    : 0;
  const discountFactor = eligibleSubtotal > 0 ? 1 - discountAmount / eligibleSubtotal : 1;

  function isEligible(productId: string) {
    return !!appliedDiscount && (appliedDiscount.appliesToProductIds === null || appliedDiscount.appliesToProductIds.includes(productId));
  }

  const discountedTotalPrice = items.reduce(
    (s, i) => s + (isEligible(i.productId) ? i.priceUsd * discountFactor : i.priceUsd) * i.quantity,
    0
  );
  const discountedTotalDeposit = items.reduce(
    (s, i) =>
      s + ((isEligible(i.productId) ? i.priceUsd * discountFactor : i.priceUsd) * i.depositPct) / 100 * i.quantity,
    0
  );
  const originalToCharge = paymentMode === "completo" ? totalPrice : totalDeposit;
  const figurinesToCharge = Math.round((paymentMode === "completo" ? discountedTotalPrice : discountedTotalDeposit) * 100) / 100;
  const discountDisplayAmount = Math.round((originalToCharge - figurinesToCharge) * 100) / 100;
  const totalDepositWithDelivery = figurinesToCharge + deliveryCost;

  function customerIsValid() {
    return fullName.trim().length > 0 && whatsapp.trim().length >= 6;
  }

  async function applyDiscount() {
    if (!discountInput.trim()) return;
    setDiscountLoading(true);
    setDiscountError(null);
    try {
      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountInput,
          items: items.map((i) => ({ productId: i.productId, priceUsd: i.priceUsd, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!data.valid) {
        setAppliedDiscount(null);
        setDiscountError(data.error || "Código no válido");
      } else {
        setAppliedDiscount({ code: data.code, type: data.type, value: data.value, appliesToProductIds: data.appliesToProductIds });
        setDiscountError(null);
      }
    } catch {
      setDiscountError("Error al validar el código");
    } finally {
      setDiscountLoading(false);
    }
  }

  function removeDiscount() {
    setAppliedDiscount(null);
    setDiscountInput("");
    setDiscountError(null);
  }

  async function submitOrder(kushkiToken?: string) {
    if (!customerIsValid()) {
      setError("Completa tu nombre y WhatsApp antes de pagar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { full_name: fullName, whatsapp, email, address, city },
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            priceUsd: i.priceUsd,
            depositPct: paymentMode === "completo" ? 100 : i.depositPct,
            quantity: i.quantity,
          })),
          delivery: { type: delivery, cost: deliveryCost, label: DELIVERY_OPTIONS[delivery].label },
          kushkiToken: kushkiToken || undefined,
          discountCode: appliedDiscount?.code || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo procesar la reserva");

      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = "/reserva-confirmada";
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-2xl font-bold">Tu carrito</h1>

        {items.length === 0 ? (
          <div className="mt-10 text-center text-ink-700/60">
            <p>Tu carrito está vacío.</p>
            <Link href="/" className="mt-3 inline-block text-brand-600 hover:underline">Ver catálogo →</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="card flex items-center gap-4 p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                    <p className="text-sm text-brand-600">{formatUSD(item.priceUsd)}</p>
                    <p className="text-xs text-ink-700/50">Abono {item.depositPct}%: {formatUSD((item.priceUsd * item.depositPct) / 100)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                      className="input w-16 text-center"
                    />
                    <button onClick={() => removeItem(item.productId)} className="text-xs text-ink-700/40 hover:text-red-400">
                      quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="card p-5">
                <p className="mb-3 font-semibold">Entrega</p>
                <div className="space-y-2">
                  {(Object.entries(DELIVERY_OPTIONS) as [DeliveryType, (typeof DELIVERY_OPTIONS)[DeliveryType]][]).map(
                    ([key, opt]) => (
                      <label
                        key={key}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                          delivery === key ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:bg-ink-100"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="delivery_type"
                            checked={delivery === key}
                            onChange={() => setDelivery(key)}
                          />
                          {opt.label}
                        </span>
                        <span className="font-semibold">{formatUSD(opt.cost)}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="card p-5">
                <p className="mb-3 font-semibold">¿Cómo quieres pagar?</p>
                <div className="space-y-2">
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                      paymentMode === "abono" ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:bg-ink-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input type="radio" name="payment_mode" checked={paymentMode === "abono"} onChange={() => setPaymentMode("abono")} />
                      Abono ahora, resto al llegar
                    </span>
                    <span className="font-semibold">{formatUSD(totalDeposit)}</span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                      paymentMode === "completo" ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:bg-ink-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input type="radio" name="payment_mode" checked={paymentMode === "completo"} onChange={() => setPaymentMode("completo")} />
                      Pagar todo ahora
                    </span>
                    <span className="font-semibold">{formatUSD(totalPrice)}</span>
                  </label>
                </div>
              </div>

              <div className="card p-5">
                <p className="mb-3 font-semibold">Código de descuento</p>
                {appliedDiscount ? (
                  <div className="flex items-center justify-between rounded-lg border border-brand-500 bg-brand-50 px-3 py-2 text-sm">
                    <span>
                      <strong>{appliedDiscount.code}</strong> aplicado
                      {eligibleItems.length < items.length && (
                        <span className="text-ink-700/50"> (solo en algunos productos)</span>
                      )}
                    </span>
                    <button type="button" onClick={removeDiscount} className="text-xs text-ink-700/50 hover:text-red-400">
                      quitar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      className="input"
                      placeholder="Ingresa tu código"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={applyDiscount}
                      disabled={discountLoading || !discountInput.trim()}
                      className="btn-secondary shrink-0"
                    >
                      {discountLoading ? "..." : "Aplicar"}
                    </button>
                  </div>
                )}
                {discountError && <p className="mt-2 text-xs text-red-400">{discountError}</p>}
              </div>

              <div className="card p-5">
                <div className="flex justify-between text-sm text-ink-700/70">
                  <span>Productos {paymentMode === "completo" ? "(pago completo)" : "(abono)"}</span>
                  <span>{formatUSD(originalToCharge)}</span>
                </div>
                {appliedDiscount && discountDisplayAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Descuento ({appliedDiscount.code})</span>
                    <span>-{formatUSD(discountDisplayAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-ink-700/70">
                  <span>Envío ({DELIVERY_OPTIONS[delivery].label})</span>
                  <span>{formatUSD(deliveryCost)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-ink-200 pt-1 font-semibold text-brand-600">
                  <span>Total a pagar hoy</span>
                  <span>{formatUSD(totalDepositWithDelivery)}</span>
                </div>
                <p className="mt-2 text-xs text-ink-700/50">
                  {paymentMode === "completo"
                    ? "Pagas el precio completo de tu pedido hoy. El envío también se paga completo hoy."
                    : "El saldo restante se paga al retirar o recibir tu pedido. El envío se paga completo hoy."}
                </p>
              </div>

              <div className="card space-y-3 p-5">
                <p className="font-semibold">Tus datos</p>
                <div>
                  <label className="label" htmlFor="full_name">Nombre completo *</label>
                  <input className="input" id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label className="label" htmlFor="whatsapp">WhatsApp *</label>
                  <input className="input" id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required placeholder="+593..." />
                </div>
                <div>
                  <label className="label" htmlFor="email">Correo</label>
                  <input className="input" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="city">Ciudad</label>
                  <input className="input" id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="address">Dirección de entrega</label>
                  <input className="input" id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                {KUSHKI_ENABLED ? (
                  <div className="border-t border-ink-200 pt-3">
                    <p className="mb-2 text-xs text-ink-700/50">Pago seguro con tarjeta (Kushki)</p>
                    <KushkiCardForm amount={totalDepositWithDelivery} onToken={(token) => submitOrder(token)} disabled={loading} />
                  </div>
                ) : (
                  <button type="button" disabled={loading} onClick={() => submitOrder()} className="btn-primary w-full">
                    {loading ? "Procesando..." : `Pagar ${formatUSD(totalDepositWithDelivery)}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
