import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/store/Header";
import { createServerSupabase } from "@/lib/supabase/server";
import { signOutCustomer } from "./actions";

export const dynamic = "force-dynamic";

const OPTIONS = [
  { href: "/cuenta/pedidos", icon: "📦", label: "Mis pedidos" },
  { href: "/cuenta/datos", icon: "🧾", label: "Datos personales" },
  { href: "/cuenta/correo", icon: "✉️", label: "Cambiar correo" },
  { href: "/cuenta/password", icon: "🔒", label: "Cambiar contraseña" },
];

export default async function CuentaPage() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/cuenta/login");

  const { data: customer } = await supabase
    .from("customers")
    .select("full_name")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl">
          👤
        </div>
        <h1 className="mt-4 font-display text-xl font-bold">Hola, {customer?.full_name || session.user.email}</h1>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {OPTIONS.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              className="card flex flex-col items-center gap-2 p-5 transition hover:border-brand-400/50 hover:shadow-md"
            >
              <span className="text-2xl">{o.icon}</span>
              <span className="text-sm font-medium text-ink-900">{o.label}</span>
            </Link>
          ))}
        </div>

        <form action={signOutCustomer} className="mt-10">
          <button type="submit" className="btn-secondary">Cerrar sesión</button>
        </form>
      </main>
    </div>
  );
}
