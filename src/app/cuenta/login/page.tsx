import Link from "next/link";
import Header from "@/components/store/Header";
import { signInCustomer } from "../actions";

export default async function CuentaLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-sm px-4 py-16">
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold text-brand-600">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-ink-700/60">Entra a tu cuenta de COMECSA.</p>

          {params.error && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{params.error}</p>
          )}

          <form action={signInCustomer} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Correo</label>
              <input className="input" id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn-primary w-full">Entrar</button>
          </form>

          <p className="mt-4 text-center text-sm text-ink-700/60">
            ¿No tienes cuenta? <Link href="/cuenta/registro" className="text-brand-600 hover:underline">Regístrate</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
