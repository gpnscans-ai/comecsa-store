import { upsertSeller } from "@/app/admin/vendedores/actions";
import type { Seller } from "@/types/database";

export default function SellerForm({ seller }: { seller?: Seller }) {
  return (
    <form action={upsertSeller} className="card space-y-4 p-6">
      {seller && <input type="hidden" name="id" value={seller.id} />}

      <div>
        <label className="label" htmlFor="full_name">Nombre completo *</label>
        <input className="input" id="full_name" name="full_name" required defaultValue={seller?.full_name} />
      </div>

      <div>
        <label className="label" htmlFor="commission_pct">Comisión por venta (%)</label>
        <input
          className="input"
          id="commission_pct"
          name="commission_pct"
          type="number"
          step="0.01"
          min="0"
          max="100"
          defaultValue={seller?.commission_pct ?? 5}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="active" defaultChecked={seller?.active ?? true} className="h-4 w-4 rounded border-ink-200 bg-white" />
        Vendedor activo
      </label>

      <button type="submit" className="btn-primary">{seller ? "Guardar cambios" : "Crear vendedor"}</button>
    </form>
  );
}
