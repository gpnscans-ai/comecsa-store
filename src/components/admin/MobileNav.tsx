"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/login/actions";
import { ADMIN_NAV } from "@/lib/adminNav";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [openHref, setOpenHref] = useState<string | null>(null);
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
          {ADMIN_NAV.map((item) => {
            if (!item.children) {
              return (
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
              );
            }

            const isOpen = openHref === item.href || pathname === item.href;

            return (
              <div key={item.href}>
                <button
                  type="button"
                  onClick={() => setOpenHref(isOpen ? null : item.href)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    pathname === item.href ? "bg-brand-600 text-white" : "text-ink-700 hover:bg-ink-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                  <span className={`text-xs transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
                </button>
                {isOpen && (
                  <div className="ml-7 mt-1 space-y-0.5 border-l border-ink-200 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-2 py-1.5 text-xs text-ink-700/70 hover:bg-ink-100 hover:text-ink-900"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
