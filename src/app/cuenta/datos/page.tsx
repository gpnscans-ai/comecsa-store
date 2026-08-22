import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { updateCustomerProfile } from "../actions";

export const dynamic = "force-dynamic";

export default async function DatosPersonalesPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/cuenta/login");

  const { data: customer } = await supabase.from("customers").select("*").eq("user_id", session.user.id).maybeSingle();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-sm px-4 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Datos personales</h1>
          <Link href="/cuenta" className="text-sm text-ink-700/60 hover:text-brand-600">← Mi cuenta</Link>
        </div>

        <div className="card p-8">
          {params.ok && (
            <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">Datos guardados ✓</p>
          )}
          {params.error && (
            <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{params.error}</p>
          )}

          <form action={updateCustomerProfile} className="space-y-4">
            <div>
              <label className="label" htmlFor="full_name">Nombre completo *</label>
              <input className="input" id="full_name" name="full_name" required defaultValue={customer?.full_name ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="whatsapp">WhatsApp</label>
              <input className="input" id="whatsapp" name="whatsapp" defaultValue={customer?.whatsapp ?? ""} placeholder="+593..." />
            </div>
            <div>
              <label className="label" htmlFor="city">Ciudad</label>
              <input className="input" id="city" name="city" defaultValue={customer?.city ?? ""} />
            </div>
            <div>
              <label className="label" htmlFor="address">Dirección</label>
              <input className="input" id="address" name="address" defaultValue={customer?.address ?? ""} />
            </div>
            <button type="submit" className="btn-primary w-full">Guardar cambios</button>
          </form>
        </div>
      </main>
    </div>
  );
}
