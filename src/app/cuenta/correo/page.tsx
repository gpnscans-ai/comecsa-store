import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { updateCustomerEmail } from "../actions";

export const dynamic = "force-dynamic";

export default async function CambiarCorreoPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/cuenta/login");

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-sm px-4 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Cambiar correo</h1>
          <Link href="/cuenta" className="text-sm text-ink-700/60 hover:text-brand-600">← Mi cuenta</Link>
        </div>

        <div className="card p-8">
          <p className="mb-4 text-sm text-ink-700/60">Correo actual: <span className="font-medium text-ink-900">{session.user.email}</span></p>

          {params.ok && (
            <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
              Te enviamos un enlace de confirmación al correo nuevo. El cambio se aplica cuando lo confirmes.
            </p>
          )}
          {params.error && (
            <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{params.error}</p>
          )}

          <form action={updateCustomerEmail} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Correo nuevo</label>
              <input className="input" id="email" name="email" type="email" required />
            </div>
            <button type="submit" className="btn-primary w-full">Enviar confirmación</button>
          </form>
        </div>
      </main>
    </div>
  );
}
