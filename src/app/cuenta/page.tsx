import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { signOutCustomer } from "./actions";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/cuenta/login");

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold">Mi cuenta</h1>
          <div className="mt-6 space-y-2 text-sm">
            <p><span className="text-ink-700/50">Nombre:</span> {customer?.full_name || "—"}</p>
            <p><span className="text-ink-700/50">Correo:</span> {session.user.email}</p>
            <p><span className="text-ink-700/50">WhatsApp:</span> {customer?.whatsapp || "—"}</p>
            <p><span className="text-ink-700/50">Ciudad:</span> {customer?.city || "—"}</p>
            <p><span className="text-ink-700/50">Dirección:</span> {customer?.address || "—"}</p>
          </div>
          <p className="mt-4 text-xs text-ink-700/50">
            Estos datos se usan para llenar tu información automáticamente cuando compras.
          </p>
          <form action={signOutCustomer} className="mt-6">
            <button type="submit" className="btn-secondary w-full">Cerrar sesión</button>
          </form>
        </div>
      </main>
    </div>
  );
}
