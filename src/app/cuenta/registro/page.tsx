import Link from "next/link";
import Header from "@/components/store/Header";
import { signUpCustomer } from "../actions";

export default async function RegistroPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-sm px-4 py-16">
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold text-brand-600">Crear cuenta</h1>
          <p className="mt-1 text-sm text-ink-700/60">Regístrate para agilizar tus próximas compras.</p>

          {params.error && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{params.error}</p>
          )}

          <form action={signUpCustomer} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="full_name">Nombre completo *</label>
              <input className="input" id="full_name" name="full_name" required />
            </div>
            <div>
              <label className="label" htmlFor="email">Correo *</label>
              <input className="input" id="email" name="email" type="email" required />
            </div>
            <div>
              <label className="label" htmlFor="whatsapp">WhatsApp</label>
              <input className="input" id="whatsapp" name="whatsapp" placeholder="+593..." />
            </div>
            <div>
              <label className="label" htmlFor="password">Contraseña *</label>
              <input className="input" id="password" name="password" type="password" required minLength={6} />
            </div>
            <button type="submit" className="btn-primary w-full">Crear cuenta</button>
          </form>

          <p className="mt-4 text-center text-sm text-ink-700/60">
            ¿Ya tienes cuenta? <Link href="/cuenta/login" className="text-brand-600 hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
