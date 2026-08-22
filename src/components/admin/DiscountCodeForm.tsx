"use client";

import { useState } from "react";
import { createDiscountCode } from "@/app/admin/promociones/actions";

type ProductOption = { id: string; name: string };

export default function DiscountCodeForm({ products }: { products: ProductOption[] }) {
  const [scope, setScope] = useState<"all" | "selected">("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : products;

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await createDiscountCode(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Código</label>
          <input className="input uppercase" name="code" required placeholder="Ej: VERANO20" maxLength={30} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" name="type" defaultValue="percentage">
            <option value="percentage">Porcentaje (%)</option>
            <option value="fixed">Monto fijo ($)</option>
          </select>
        </div>
        <div>
          <label className="label">Valor del descuento</label>
          <input className="input" name="value" type="number" step="0.01" min="0.01" required placeholder="Ej: 20" />
        </div>
        <div>
          <label className="label">Límite de usos (opcional)</label>
          <input className="input" name="usage_limit" type="number" min="1" placeholder="Sin límite" />
        </div>
        <div>
          <label className="label">Vence el (opcional)</label>
          <input className="input" name="expires_at" type="date" />
        </div>
      </div>

      <div>
        <label className="label">¿A qué productos aplica?</label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="scope" value="all" checked={scope === "all"} onChange={() => setScope("all")} />
            Todo el catálogo
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="scope"
              value="selected"
              checked={scope === "selected"}
              onChange={() => setScope("selected")}
            />
            Solo productos seleccionados
          </label>
        </div>

        {scope === "selected" && (
          <div className="mt-3 rounded-lg border border-ink-200 p-3">
            <input
              className="input mb-2"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filtered.map((p) => (
                <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-ink-100">
                  <input type="checkbox" name="product_ids" value={p.id} />
                  {p.name}
                </label>
              ))}
              {filtered.length === 0 && <p className="px-2 py-1 text-sm text-ink-700/50">Sin resultados.</p>}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" className="btn-primary">Crear código</button>
    </form>
  );
}
