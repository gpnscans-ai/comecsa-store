import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import Header from "@/components/store/Header";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import ChatWidget from "@/components/store/ChatWidget";
import AddToCartButton from "@/components/store/AddToCartButton";
import { formatUSD, whatsappLink } from "@/lib/utils";
import { getEffectiveUnitPrice, promoBadgeLabel } from "@/lib/promo";
import { withIva, DEFAULT_IVA_PCT } from "@/lib/tax";
import { PRODUCT_STATUS_LABEL, PRODUCT_CATEGORY_LABEL, type Product } from "@/types/database";

export const revalidate = 60;

export default async function ProductoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single<Product>();

  if (!product) notFound();

  const admin = createAdminSupabase();
  const { data: settings } = await admin.from("business_settings").select("iva_pct").eq("id", 1).maybeSingle();
  const ivaPct = settings?.iva_pct != null ? Number(settings.iva_pct) : DEFAULT_IVA_PCT;

  const effectivePrice = withIva(getEffectiveUnitPrice(product), ivaPct);
  const originalPrice = withIva(product.price_usd, ivaPct);
  const badge = promoBadgeLabel(product);
  const hasPriceCut = product.promo_active && product.promo_type !== "2x1";
  const depositAmount = (effectivePrice * product.deposit_pct) / 100;
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="card aspect-square overflow-hidden bg-ink-100">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">🛍️</div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="badge bg-ink-100 text-ink-700/70">{PRODUCT_CATEGORY_LABEL[product.category]}</span>
              <span className="badge bg-ink-100 text-ink-700/70">{PRODUCT_STATUS_LABEL[product.status]}</span>
              {badge && <span className="badge bg-red-500 text-white">{badge}</span>}
            </div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{product.name}</h1>
            {hasPriceCut ? (
              <p className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-brand-600">{formatUSD(effectivePrice)}</span>
                <span className="text-lg text-ink-700/40 line-through">{formatUSD(originalPrice)}</span>
              </p>
            ) : (
              <p className="text-3xl font-extrabold text-brand-600">
                {formatUSD(originalPrice)}
                {product.promo_active && product.promo_type === "2x1" && (
                  <span className="ml-2 text-base font-normal text-ink-700/50">c/u — llévate 2 y paga 1</span>
                )}
              </p>
            )}
            <p className="text-xs text-ink-700/40">IVA {ivaPct}% incluido</p>

            {product.sizes && (
              <p className="text-sm text-ink-700/70">📏 Tallas/números disponibles: {product.sizes}</p>
            )}

            <div className="card border-brand-400/40 bg-brand-50 p-4">
              <p className="text-sm text-ink-800">
                Aparta con un abono de <span className="font-semibold text-brand-600">{formatUSD(depositAmount)}</span> ({product.deposit_pct}%)
                y paga el resto al retirar o recibir tu pedido.
              </p>
            </div>

            <AddToCartButton product={product} />

            {whatsappNumber && (
              <a
                href={whatsappLink(whatsappNumber, `Hola! Me interesa "${product.name}" (${formatUSD(effectivePrice)}). ¿Está disponible?`)}
                target="_blank"
                className="block text-center text-sm text-ink-700/60 hover:text-emerald-400"
              >
                ¿Dudas? Pregunta por WhatsApp →
              </a>
            )}

            {product.description && (
              <div className="prose max-w-none pt-4 text-sm text-ink-700">
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <WhatsAppButton />
      <ChatWidget />
    </div>
  );
}
