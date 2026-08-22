import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="font-display text-2xl font-bold text-brand-600">COMECSA Admin</h1>
        <p className="mt-1 text-sm text-ink-700/60">Ingresa para gestionar pedidos, clientes y stock.</p>

        {params.error && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {params.error}
          </p>
        )}

        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="redirectTo" value={params.redirectTo || "/admin"} />
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
      </div>
    </div>
  );
}
