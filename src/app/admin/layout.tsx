import Link from "next/link";
import { logout } from "./login/actions";
import MobileNav from "@/components/admin/MobileNav";
import DesktopNav from "@/components/admin/DesktopNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-dark flex min-h-screen flex-col md:flex-row">
      <MobileNav />
      <aside className="hidden w-64 shrink-0 border-r border-ink-200 bg-white p-5 md:flex md:flex-col">
        <div className="mb-8">
          <p className="font-display text-xl font-bold text-brand-600">COMECSA</p>
          <p className="text-xs text-ink-700/50">Panel de administración</p>
        </div>
        <DesktopNav />
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
