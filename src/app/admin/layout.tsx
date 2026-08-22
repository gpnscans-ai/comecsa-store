import Link from "next/link";
import { logout } from "./login/actions";
import MobileNav from "@/components/admin/MobileNav";

const NAV = [
  { href: "/admin", label: "Resumen", icon: "📊" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "📦" },
  { href: "/admin/clientes", label: "Clientes (CRM)", icon: "👥" },
  { href: "/admin/productos", label: "Catálogo", icon: "🛍️" },
  { href: "/admin/finanzas", label: "Finanzas", icon: "💰" },
  { href: "/admin/facturas", label: "Facturas", icon: "🧾" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-dark flex min-h-screen flex-col md:flex-row">
      <MobileNav />
      <aside className="hidden w-64 shrink-0 border-r border-ink-200 bg-white p-5 md:flex md:flex-col">
        <div className="mb-8">
          <p className="font-display text-xl font-bold text-brand-600">COMECSA</p>
          <p className="text-xs text-ink-700/50">Panel de administración</p>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-100 hover:text-ink-900"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 pt-4">
          <Link href="/" className="block text-xs text-ink-700/50 hover:text-ink-900/70">← Ver tienda pública</Link>
          <form action={logout}>
            <button className="btn-secondary w-full text-sm">Cerrar sesión</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 bg-white p-4 md:p-8">{children}</main>
    </div>
  );
}
