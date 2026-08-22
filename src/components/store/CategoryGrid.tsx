import Link from "next/link";
import type { ProductCategory } from "@/types/database";

const CATEGORIES: { key: ProductCategory; label: string; image: string }[] = [
  { key: "calzado", label: "Calzado", image: "https://comecsa.ec/calzado.jpg" },
  { key: "ropa", label: "Ropa", image: "https://comecsa.ec/ropa.jpg" },
  { key: "hogar", label: "Artículos para el hogar", image: "https://comecsa.ec/Hogar.jpg" },
  { key: "accesorios", label: "Accesorios", image: "https://comecsa.ec/accesorios.png" },
];

export default function CategoryGrid() {
  return (
    <section className="bg-white py-14">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold text-ink-900 sm:text-4xl">Nuestras Categorías</h2>
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/?categoria=${c.key}#catalogo`}
              className="group overflow-hidden rounded-2xl border border-ink-200 shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-square w-full overflow-hidden bg-ink-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image}
                  alt={c.label}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <p className="py-3 text-center text-sm font-semibold text-ink-900 group-hover:text-brand-600">
                {c.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
