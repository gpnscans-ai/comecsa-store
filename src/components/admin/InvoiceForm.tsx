"use client";

import { useMemo, useState } from "react";
import { formatUSD } from "@/lib/utils";

interface CustomerOption {
  id: string;
  full_name: string;
  address: string | null;
}

interface ItemRow {
  description: string;
  quantity: string;
  unit_price: string;
}

export default function InvoiceForm({
  action,
  customers,
  ivaPctDefault,
  docTypeDefault,
  prefill,
}: {
  action: (formData: FormData) => void;
  customers: CustomerOption[];
  ivaPctDefault: number;
  docTypeDefault: string;
  prefill?: { orderId?: string; customerId?: string; itemName?: string; price?: number };
}) {
  const [customerId, setCustomerId] = useState(prefill?.customerId || "");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [ivaPct, setIvaPct] = useState(String(ivaPctDefault));
  const [items, setItems] = useState<ItemRow[]>([
    { description: prefill?.itemName || "", quantity: "1", unit_price: prefill?.price ? String(prefill.price) : "" },
  ]);

  function handleCustomerSelect(id: string) {
    setCustomerId(id);
    const c = customers.find((c) => c.id === id);
    if (c) {
      setCustomerName(c.full_name);
      setCustomerAddress(c.address || "");
    }
  }

  function updateItem(i: number, field: keyof ItemRow, value: string) {
    setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setItems((prev) => [...prev, { description: "", quantity: "1", unit_price: "" }]);
  }

  function removeRow(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const subtotal = useMemo(
    () => items.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unit_price) || 0), 0),
    [items]
  );
  const ivaAmount = subtotal * (Number(ivaPct) / 100 || 0);
  const total = subtotal + ivaAmount;

  return (
    <form action={action} className="card space-y-5 p-6">
      {prefill?.orderId && <input type="hidden" name="order_id" value={prefill.orderId} />}

      <div>
        <label className="label" htmlFor="customer_select">Cliente existente (opcional)</label>
        <select
          className="input"
          id="customer_select"
          value={customerId}
          onChange={(e) => handleCustomerSelect(e.target.value)}
        >
          <option value="">— Escribir datos manualmente —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </select>
        <input type="hidden" name="customer_id" value={customerId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="customer_name">Nombre / Razón social del cliente *</label>
          <input
            className="input"
            id="customer_name"
            name="customer_name"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="customer_id_number">Cédula / RUC del cliente</label>
          <input className="input" id="customer_id_number" name="customer_id_number" placeholder="Consumidor final si no tiene" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="customer_address">Dirección del cliente</label>
        <input
          className="input"
          id="customer_address"
          name="customer_address"
          value={customerAddress}
          onChange={(e) => setCustomerAddress(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="doc_type">Tipo de comprobante</label>
        <select className="input" id="doc_type" name="doc_type" defaultValue={docTypeDefault}>
          <option value="nota_venta">Nota de venta</option>
          <option value="factura">Factura</option>
        </select>
      </div>

      <div className="space-y-3">
        <p className="label !mb-0">Ítems</p>
        {items.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_5rem_6rem_auto] items-end gap-2">
            <div>
              {i === 0 && <label className="label">Descripción</label>}
              <input
                className="input"
                name="item_description"
                value={row.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                required
              />
            </div>
            <div>
              {i === 0 && <label className="label">Cant.</label>}
              <input
                className="input"
                name="item_quantity"
                type="number"
                min="1"
                step="1"
                value={row.quantity}
                onChange={(e) => updateItem(i, "quantity", e.target.value)}
                required
              />
            </div>
            <div>
              {i === 0 && <label className="label">P. unit.</label>}
              <input
                className="input"
                name="item_unit_price"
                type="number"
                min="0"
                step="0.01"
                value={row.unit_price}
                onChange={(e) => updateItem(i, "unit_price", e.target.value)}
                required
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={items.length === 1}
              className="h-10 px-2 text-xs text-ink-700/50 hover:text-red-400 disabled:opacity-30"
            >
              quitar
            </button>
          </div>
        ))}
        <button type="button" onClick={addRow} className="btn-secondary text-sm">+ Agregar ítem</button>
      </div>

      <div className="rounded-lg border border-ink-200 p-4">
        <div className="grid grid-cols-2 gap-2 sm:w-64 sm:ml-auto">
          <span className="text-sm text-ink-700/70">Subtotal</span>
          <span className="text-right text-sm">{formatUSD(subtotal)}</span>
          <span className="flex items-center gap-2 text-sm text-ink-700/70">
            IVA
            <input
              className="input w-16 py-0.5 text-xs"
              name="iva_pct"
              type="number"
              step="0.01"
              value={ivaPct}
              onChange={(e) => setIvaPct(e.target.value)}
            />
            %
          </span>
          <span className="text-right text-sm">{formatUSD(ivaAmount)}</span>
          <span className="text-sm font-semibold">Total</span>
          <span className="text-right font-semibold text-brand-600">{formatUSD(total)}</span>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="notes">Notas</label>
        <textarea className="input" id="notes" name="notes" rows={2} />
      </div>

      <button type="submit" className="btn-primary">Emitir comprobante</button>
    </form>
  );
}
