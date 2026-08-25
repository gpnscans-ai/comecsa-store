import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/utils";
import ExportButton from "@/components/admin/ExportButton";
import { PRODUCT_CATEGORY_LABEL, PRODUCT_STATUS_LABEL, type Product, type ProductCategory } from "@/types/database";

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 3;
const CATEGORY_ORDER = Object.keys(PRODUCT_CATEGORY_LABEL) as ProductCategory[];

function stockTone(stock: number) {
  if (stock <= 0) return "text-red-500";
  if (stock <= LOW_STOCK_THRESHOLD) return "text-amber-500";
  return "text-emerald-600";
}

export default async function InventarioPage() {
  const supabase = await createServerSupabase();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("name");

  const byCategory = new Map<ProductCategory, Product[]>();
  for (const p of (products || []) as Product[]) {
    const list = byCategory.get(p.category) || [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  const totalUnits = (products || []).reduce((s, p) => s + p.stock_quantity, 0);
  const outOfStockCount = (products || []).filter((p) => p.stock_quantity <= 0).length;
  const lowStockCount = (products || []).filter((p) => p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK_THRESHOLD).length;
  const totalValue = (products || []).reduce((s, p) => s + p.stock_quantity * Number(p.cost_usd || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Inventario</h1>
          <p className="text-sm text-ink-700/60">Stock actual agrupado por sección del catálogo.</p>
        </div>
        <ExportButton type="productos" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Unidades totales</p>
          <p className="mt-2 text-xl font-bold">{totalUnits}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Valor del inventario (costo)</p>
          <p className="mt-2 text-xl font-bold text-brand-600">{formatUSD(totalValue)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Stock bajo (≤{LOW_STOCK_THRESHOLD})</p>
          <p className={`mt-2 text-xl font-bold ${lowStockCount > 0 ? "text-amber-500" : ""}`}>{lowStockCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-700/50">Agotados</p>
          <p className={`mt-2 text-xl font-bold ${outOfStockCount > 0 ? "text-red-500" : ""}`}>{outOfStockCount}</p>
        </div>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const items = byCategory.get(category);
        if (!items || items.length === 0) return null;
        const sectionUnits = items.reduce((s, p) => s + p.stock_quantity, 0);

        return (
          <div key={category} className="card overflow-x-auto p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">{PRODUCT_CATEGORY_LABEL[category]}</h2>
              <span className="text-sm text-ink-700/50">{items.length} producto{items.length === 1 ? "" : "s"} · {sectionUnits} unidades</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2">Tallas</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-ink-100 hover:bg-ink-100">
                    <td className="px-3 py-2">
                      <Link href={`/admin/productos/${p.id}`} className="font-medium hover:text-brand-600">{p.name}</Link>
                    </td>
                    <td className="px-3 py-2 text-ink-700/60">{p.sizes || "—"}</td>
                    <td className="px-3 py-2">
                      <span className="badge bg-ink-100 text-ink-700">{PRODUCT_STATUS_LABEL[p.status]}</span>
                    </td>
                    <td className={`px-3 py-2 text-right font-semibold ${stockTone(p.stock_quantity)}`}>
                      {p.stock_quantity}
                      {p.stock_quantity <= 0 && <span className="ml-1 text-xs font-normal">(agotado)</span>}
                      {p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK_THRESHOLD && <span className="ml-1 text-xs font-normal">(bajo)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {(!products || products.length === 0) && (
        <p className="card p-8 text-center text-sm text-ink-700/50">Aún no hay productos en el catálogo.</p>
      )}
    </div>
  );
}
