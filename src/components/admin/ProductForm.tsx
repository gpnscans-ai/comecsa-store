"use client";

import { useState } from "react";
import { upsertProduct } from "@/app/admin/productos/actions";
import { PRODUCT_CATEGORY_LABEL, PRODUCT_STATUS_LABEL, type Product } from "@/types/database";
import ImageUploader from "./ImageUploader";

export default function ProductForm({ product }: { product?: Product }) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [sourceUrl, setSourceUrl] = useState(product?.source_url ?? "");
  const [costUsd, setCostUsd] = useState(product?.cost_usd?.toString() ?? "");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");

  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importedOk, setImportedOk] = useState(false);

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError("");
    setImportedOk(false);
    try {
      const res = await fetch("/api/admin/import-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo importar");

      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      if (data.image_url) setImageUrl(data.image_url);
      if (data.source_url) setSourceUrl(data.source_url);
      setImportedOk(true);
    } catch (err: any) {
      setImportError(err.message || "No se pudo importar esa página");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {!product && (
        <div className="card space-y-2 border-brand-400/40 bg-brand-50 p-4">
          <label className="label" htmlFor="import_url">Importar desde un link de proveedor</label>
          <div className="flex gap-2">
            <input
              className="input"
              id="import_url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://catalogo-proveedor.com/producto..."
            />
            <button type="button" onClick={handleImport} disabled={importing} className="btn-secondary whitespace-nowrap">
              {importing ? "Leyendo..." : "🔗 Importar"}
            </button>
          </div>
          {importError && <p className="text-xs text-red-400">{importError}</p>}
          {importedOk && <p className="text-xs text-emerald-400">Se rellenó nombre, foto y descripción. Revisa y completa el precio en USD.</p>}
          <p className="text-xs text-ink-700/50">
            No siempre logra leer todos los datos (algunos sitios los cargan con JavaScript) — verifica antes de guardar.
          </p>
        </div>
      )}

      <form action={upsertProduct} className="card space-y-4 p-6">
        {product && <input type="hidden" name="id" value={product.id} />}

        <div>
          <label className="label" htmlFor="name">Nombre *</label>
          <input className="input" id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category">Categoría</label>
            <select className="input" id="category" name="category" defaultValue={product?.category || "otro"}>
              {Object.entries(PRODUCT_CATEGORY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">Estado</label>
            <select className="input" id="status" name="status" defaultValue={product?.status || "disponible"}>
              {Object.entries(PRODUCT_STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Imagen del producto</label>
          <ImageUploader value={imageUrl} onChange={setImageUrl} />
        </div>

        <div>
          <label className="label" htmlFor="source_url">Link de referencia (proveedor/mayorista)</label>
          <input
            className="input"
            id="source_url"
            name="source_url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://proveedor.com/producto..."
          />
        </div>

        <div>
          <label className="label" htmlFor="description">Descripción</label>
          <textarea
            className="input"
            id="description"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="sizes">Tallas / números disponibles</label>
          <input
            className="input"
            id="sizes"
            name="sizes"
            defaultValue={product?.sizes ?? ""}
            placeholder="S, M, L, XL o 35, 36, 37, 38..."
          />
        </div>

        <div className="rounded-lg border border-ink-200 p-3">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-700/60">Costeo</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="cost_usd">Costo (USD)</label>
              <input
                className="input"
                id="cost_usd"
                name="cost_usd"
                type="number"
                step="0.01"
                value={costUsd}
                onChange={(e) => setCostUsd(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="margin_pct">Margen %</label>
              <input className="input" id="margin_pct" name="margin_pct" type="number" step="1" defaultValue={product?.margin_pct ?? 30} />
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="price_usd">Precio de venta (USD) *</label>
              <input className="input" id="price_usd" name="price_usd" type="number" step="0.01" required defaultValue={product?.price_usd ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="deposit_pct">Abono requerido para apartar %</label>
              <input className="input" id="deposit_pct" name="deposit_pct" type="number" step="1" defaultValue={product?.deposit_pct ?? 40} />
            </div>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="stock_quantity">Stock disponible</label>
          <input className="input" id="stock_quantity" name="stock_quantity" type="number" defaultValue={product?.stock_quantity ?? 1} />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" name="is_published" defaultChecked={product?.is_published ?? true} className="h-4 w-4 rounded border-ink-200 bg-white" />
          Publicado en la tienda pública
        </label>

        <button type="submit" className="btn-primary">{product ? "Guardar cambios" : "Crear producto"}</button>
      </form>
    </div>
  );
}
