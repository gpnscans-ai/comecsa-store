import Link from "next/link";
import { PRODUCT_CATEGORY_LABEL, type ProductCategory } from "@/types/database";
import CartButton from "./CartButton";
import AccountMenu from "./AccountMenu";

const CATEGORIES = Object.keys(PRODUCT_CATEGORY_LABEL).filter((c) => c !== "otro") as ProductCategory[];
const LOGO_URL = "https://comecsa.ec/logo1.jpeg";

export default function Header({ activeCategory, q }: { activeCategory?: string; q?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="COMECSA" className="h-9 w-auto max-w-[160px] object-contain" />
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium text-ink-900 md:flex">
            <Link href="/" className="rounded-full px-3 py-2 hover:bg-brand-50 hover:text-brand-600">
              Inicio
            </Link>

            <div className="group relative">
              <button className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-brand-50 hover:text-brand-600">
                Productos <span className="text-xs">▾</span>
              </button>
              <div className="invisible absolute left-0 top-full z-50 w-56 rounded-xl border border-ink-200 bg-white py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c}
                    href={`/?categoria=${c}`}
                    className={`block px-4 py-2 text-sm hover:bg-brand-50 hover:text-brand-600 ${
                      activeCategory === c ? "text-brand-600" : "text-ink-900"
                    }`}
                  >
                    {PRODUCT_CATEGORY_LABEL[c]}
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/?promos=1" className="rounded-full px-3 py-2 hover:bg-brand-50 hover:text-brand-600">
              Promociones
            </Link>

            <div className="group relative">
              <button className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-brand-50 hover:text-brand-600">
                Nosotros <span className="text-xs">▾</span>
              </button>
              <div className="invisible absolute left-0 top-full z-50 w-48 rounded-xl border border-ink-200 bg-white py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                <Link href="/#mision" className="block px-4 py-2 text-sm text-ink-900 hover:bg-brand-50 hover:text-brand-600">
                  Misión
                </Link>
                <Link href="/#vision" className="block px-4 py-2 text-sm text-ink-900 hover:bg-brand-50 hover:text-brand-600">
                  Visión
                </Link>
                <Link href="/#valores" className="block px-4 py-2 text-sm text-ink-900 hover:bg-brand-50 hover:text-brand-600">
                  Valores Corporativos
                </Link>
              </div>
            </div>

            <Link href="/contacto" className="rounded-full px-3 py-2 hover:bg-brand-50 hover:text-brand-600">
              Contacto
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <CartButton />
            <AccountMenu />
            <Link href="/admin" className="hidden text-xs text-ink-700/30 hover:text-brand-600 sm:inline">
              Admin
            </Link>
          </div>
        </div>

        <form action="/" className="mt-3 md:hidden">
          <input className="input" type="search" name="q" placeholder="Buscar producto..." defaultValue={q} />
        </form>

        <nav className="mt-3 flex gap-1 overflow-x-auto pb-1 md:hidden">
          <Link href="/" className={`badge shrink-0 ${!activeCategory ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700"}`}>
            Todo
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/?categoria=${c}`}
              className={`badge shrink-0 ${activeCategory === c ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700"}`}
            >
              {PRODUCT_CATEGORY_LABEL[c]}
            </Link>
          ))}
        </nav>
      </div>

      <form action="/" className="hidden border-t border-ink-100 bg-ink-50/50 px-4 py-2 md:block">
        <input
          className="input mx-auto max-w-md"
          type="search"
          name="q"
          placeholder="Buscar producto..."
          defaultValue={q}
        />
      </form>
    </header>
  );
}
