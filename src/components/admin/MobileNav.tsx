"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/login/actions";

const NAV = [
  { href: "/admin", label: "Resumen", icon: "📊" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "📦" },
  { href: "/admin/clientes", label: "Clientes (CRM)", icon: "👥" },
  { href: "/admin/productos", label: "Catálogo", icon: "🛍️" },
  { href: "/admin/vendedores", label: "Vendedores", icon: "🧑‍💼" },
  { href: "/admin/finanzas", label: "Finanzas", icon: "💰" },
  { href: "/admin/facturas", label: "Facturas", icon: "🧾" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="border-b border-ink-200 bg-white md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="font-display text-lg font-bold text-brand-600">COMECSA</p>
          <p className="text-xs text-ink-700/50">Panel de administración</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 text-xl"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="space-y-1 border-t border-ink-200 px-4 py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                pathname === item.href ? "bg-brand-600 text-white" : "text-ink-700 hover:bg-ink-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <Link href="/" onClick={() => setOpen(false)} className="block px-3 py-2 text-xs text-ink-700/50">
            ← Ver tienda pública
          </Link>
          <form action={logout} className="px-3 pt-1">
            <button className="btn-secondary w-full text-sm">Cerrar sesión</button>
          </form>
        </nav>
      )}
    </div>
  );
}
