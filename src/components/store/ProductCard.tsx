import Link from "next/link";
import { formatUSD } from "@/lib/utils";
import { PRODUCT_STATUS_LABEL, type Product } from "@/types/database";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/productos/${product.slug}`} className="card group overflow-hidden transition hover:border-brand-400/50 hover:shadow-md">
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
        <p className="text-lg font-bold text-brand-600">{formatUSD(product.price_usd)}</p>
      </div>
    </Link>
  );
}
