import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/utils";
import {
  PRODUCT_STATUS_LABEL,
  PRODUCT_CATEGORY_LABEL,
  type Product,
  type ProductCategory,
} from "@/types/database";
import { archiveProduct } from "./actions";
import ExportButton from "@/components/admin/ExportButton";
import ImportButton from "@/components/admin/ImportButton";

export const dynamic = "force-dynamic";

const CATEGORY_KEYS = Object.keys(PRODUCT_CATEGORY_LABEL) as ProductCategory[];

export default async function ProductosPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { categoria: categoriaParam } = await searchParams;
  const categoria = CATEGORY_KEYS.includes(categoriaParam as ProductCategory) ? (categoriaParam as ProductCategory) : null;

  const supabase = await createServerSupabase();
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (categoria) query = query.eq("category", categoria);
  const { data: products } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Catálogo{categoria && <span className="text-ink-700/50"> — {PRODUCT_CATEGORY_LABEL[categoria]}</span>}
          </h1>
          <p className="text-sm text-ink-700/60">
            Productos publicados en la tienda y control de costos.
            {categoria && (
              <>
                {" "}
                <Link href="/admin/productos" className="text-brand-600 hover:underline">Quitar filtro</Link>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton type="productos" />
          <ImportButton type="productos" />
          <Link href="/admin/productos/nuevo" className="btn-primary">+ Nuevo producto</Link>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Costo USD</th>
              <th className="px-4 py-3">Precio USD</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(products || []).map((p: Product) => (
              <tr key={p.id} className="border-b border-ink-100 hover:bg-ink-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/productos/${p.id}`} className="font-medium hover:text-brand-600">{p.name}</Link>
                  {!p.is_published && <span className="ml-2 badge bg-ink-100 text-ink-700/50">oculto</span>}
                </td>
                <td className="px-4 py-3 text-ink-700/70">{PRODUCT_CATEGORY_LABEL[p.category]}</td>
                <td className="px-4 py-3 text-ink-700/70">{p.cost_usd ? formatUSD(p.cost_usd) : "—"}</td>
                <td className="px-4 py-3 font-semibold">{formatUSD(p.price_usd)}</td>
                <td className="px-4 py-3 text-ink-700/70">{p.stock_quantity}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-ink-100 text-ink-700">{PRODUCT_STATUS_LABEL[p.status]}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={archiveProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="text-xs text-ink-700/50 hover:text-red-400">archivar</button>
                  </form>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-700/50">
                  {categoria ? `Aún no hay productos en ${PRODUCT_CATEGORY_LABEL[categoria]}.` : "Aún no hay productos."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
