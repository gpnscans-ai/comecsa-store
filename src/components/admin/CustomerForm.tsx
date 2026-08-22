import { upsertCustomer } from "@/app/admin/clientes/actions";
import type { Customer } from "@/types/database";

const CHANNELS = ["whatsapp", "instagram", "facebook", "tienda", "referido", "otro"];

export default function CustomerForm({ customer }: { customer?: Customer }) {
  return (
    <form action={upsertCustomer} className="card space-y-4 p-6">
      {customer && <input type="hidden" name="id" value={customer.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">Nombre completo *</label>
          <input className="input" id="full_name" name="full_name" required defaultValue={customer?.full_name} />
        </div>
        <div>
          <label className="label" htmlFor="channel">Canal de contacto</label>
          <select className="input" id="channel" name="channel" defaultValue={customer?.channel || "otro"}>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="whatsapp">WhatsApp</label>
          <input className="input" id="whatsapp" name="whatsapp" defaultValue={customer?.whatsapp ?? ""} placeholder="+593..." />
        </div>
        <div>
          <label className="label" htmlFor="phone">Teléfono</label>
          <input className="input" id="phone" name="phone" defaultValue={customer?.phone ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="email">Correo</label>
          <input className="input" id="email" name="email" type="email" defaultValue={customer?.email ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="instagram">Instagram</label>
          <input className="input" id="instagram" name="instagram" defaultValue={customer?.instagram ?? ""} placeholder="@usuario" />
        </div>
        <div>
          <label className="label" htmlFor="city">Ciudad</label>
          <input className="input" id="city" name="city" defaultValue={customer?.city ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="address">Dirección de entrega</label>
          <input className="input" id="address" name="address" defaultValue={customer?.address ?? ""} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="notes">Notas internas</label>
        <textarea className="input" id="notes" name="notes" rows={3} defaultValue={customer?.notes ?? ""} placeholder="Preferencias, historial, acuerdos especiales..." />
      </div>

      <button type="submit" className="btn-primary">
        {customer ? "Guardar cambios" : "Crear cliente"}
      </button>
    </form>
  );
}
