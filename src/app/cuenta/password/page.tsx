import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { updateCustomerPassword } from "../actions";

export const dynamic = "force-dynamic";

export default async function CambiarPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
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
          <h1 className="font-display text-2xl font-bold">Cambiar contraseña</h1>
          <Link href="/cuenta" className="text-sm text-ink-700/60 hover:text-brand-600">← Mi cuenta</Link>
        </div>

        <div className="card p-8">
          {params.ok && (
            <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">Contraseña actualizada ✓</p>
          )}
          {params.error && (
            <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{params.error}</p>
          )}

          <form action={updateCustomerPassword} className="space-y-4">
            <div>
              <label className="label" htmlFor="password">Nueva contraseña</label>
              <input className="input" id="password" name="password" type="password" required minLength={6} />
            </div>
            <div>
              <label className="label" htmlFor="confirm_password">Confirmar contraseña</label>
              <input className="input" id="confirm_password" name="confirm_password" type="password" required minLength={6} />
            </div>
            <button type="submit" className="btn-primary w-full">Guardar contraseña</button>
          </form>
        </div>
      </main>
    </div>
  );
}
