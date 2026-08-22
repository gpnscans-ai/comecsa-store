"use client";

import { useState } from "react";
import { sendPersonalizedDiscount } from "@/app/admin/promociones/actions";

type ProductOption = { id: string; name: string };
type CustomerOption = { id: string; full_name: string; email: string };

export default function SendDiscountToCustomerForm({
  products,
  customers,
}: {
  products: ProductOption[];
  customers: CustomerOption[];
}) {
  const [email, setEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [scope, setScope] = useState<"all" | "selected">("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : products;

  function handlePickCustomer(id: string) {
    const found = customers.find((c) => c.id === id);
    if (found) {
      setEmail(found.email);
      setCustomerName(found.full_name);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await sendPersonalizedDiscount(formData);
      setSuccess(`Código enviado a ${email}`);
      setEmail("");
      setCustomerName("");
    } catch (err: any) {
      setError(err.message || "No se pudo enviar el código");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {customers.length > 0 && (
        <div>
          <label className="label">Elegir cliente existente (opcional)</label>
          <select className="input" defaultValue="" onChange={(e) => e.target.value && handlePickCustomer(e.target.value)}>
            <option value="">— Escribir correo manualmente —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Correo del cliente</label>
          <input
            className="input"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@correo.com"
          />
        </div>
        <div>
          <label className="label">Nombre (opcional, para el saludo)</label>
          <input
            className="input"
            name="customer_name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Tipo</label>
          <select className="input" name="type" defaultValue="percentage">
            <option value="percentage">Porcentaje (%)</option>
            <option value="fixed">Monto fijo ($)</option>
          </select>
        </div>
        <div>
          <label className="label">Valor del descuento</label>
          <input className="input" name="value" type="number" step="0.01" min="0.01" required placeholder="Ej: 15" />
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
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Enviando..." : "Generar y enviar código"}
      </button>
    </form>
  );
}
