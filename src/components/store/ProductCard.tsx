import Link from "next/link";
import { formatUSD } from "@/lib/utils";
import { getEffectiveUnitPrice, promoBadgeLabel } from "@/lib/promo";
import { withIva, DEFAULT_IVA_PCT } from "@/lib/tax";
import { PRODUCT_STATUS_LABEL, type Product } from "@/types/database";

export default function ProductCard({ product, ivaPct = DEFAULT_IVA_PCT }: { product: Product; ivaPct?: number }) {
  const badge = promoBadgeLabel(product);
  const effectivePrice = withIva(getEffectiveUnitPrice(product), ivaPct);
  const originalPrice = withIva(product.price_usd, ivaPct);
  const hasPriceCut = product.promo_active && product.promo_type !== "2x1";

  return (
    <Link href={`/productos/${product.slug}`} className="card group relative overflow-hidden transition hover:border-brand-400/50 hover:shadow-md">
      {badge && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white shadow">
          {badge}
        </span>
      )}
      <div className="aspect-square w-full overflow-hidden bg-ink-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">🛍️</div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <div className="flex items-center justify-between">
          <span className="badge bg-brand-50 text-brand-700">{PRODUCT_STATUS_LABEL[product.status]}</span>
          {product.sizes && <span className="text-xs text-ink-700/60">{product.sizes}</span>}
        </div>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink-900">{product.name}</h3>
        {hasPriceCut ? (
          <p className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-brand-600">{formatUSD(effectivePrice)}</span>
            <span className="text-sm text-ink-700/40 line-through">{formatUSD(originalPrice)}</span>
          </p>
        ) : (
          <p className="text-lg font-bold text-brand-600">
            {formatUSD(originalPrice)}
            {product.promo_active && product.promo_type === "2x1" && (
              <span className="ml-2 text-xs font-normal text-ink-700/50">c/u</span>
            )}
          </p>
        )}
        <p className="text-[11px] text-ink-700/40">IVA {ivaPct}% incluido</p>
      </div>
    </Link>
  );
}
