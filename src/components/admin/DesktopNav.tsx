"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV } from "@/lib/adminNav";

export default function DesktopNav() {
  const pathname = usePathname();
  const [openHref, setOpenHref] = useState<string | null>(
    ADMIN_NAV.find((i) => i.children && pathname === i.href)?.href ?? null
  );

  return (
    <nav className="flex-1 space-y-1">
      {ADMIN_NAV.map((item) => {
        if (!item.children) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-100 hover:text-ink-900"
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
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-100 hover:text-ink-900"
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
                    className="block rounded-lg px-2 py-1.5 text-xs text-ink-700/70 transition hover:bg-ink-100 hover:text-ink-900"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
