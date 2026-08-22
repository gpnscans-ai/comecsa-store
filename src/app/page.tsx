import { createServerSupabase } from "@/lib/supabase/server";
import TopBar from "@/components/store/TopBar";
import Header from "@/components/store/Header";
import Hero from "@/components/store/Hero";
import CategoryGrid from "@/components/store/CategoryGrid";
import PromoSection from "@/components/store/PromoSection";
import Footer from "@/components/store/Footer";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import ChatWidget from "@/components/store/ChatWidget";
import ProductCard from "@/components/store/ProductCard";
import type { Product, ProductCategory } from "@/types/database";

export const revalidate = 60;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createServerSupabase();
  const categoria = sp.categoria as ProductCategory | undefined;
  const q = sp.q?.trim();

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_published", true)
    .neq("status", "archivado")
    .order("created_at", { ascending: false });

  if (categoria) query = query.eq("category", categoria);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: products } = await query;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <TopBar />
      <Header activeCategory={categoria} q={q} />
      <Hero />
      <CategoryGrid />

      <main id="catalogo" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center text-3xl font-bold text-ink-900 sm:text-4xl">
          {categoria ? "Catálogo" : "Nuestros productos"}
        </h2>
        {q && <p className="mt-4 text-center text-sm text-ink-700/60">Resultados para &quot;{q}&quot;</p>}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(products || []).map((p: Product) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {(!products || products.length === 0) && (
          <p className="py-20 text-center text-ink-700/50">No encontramos productos con ese filtro.</p>
        )}
      </main>

      <section id="mision" className="mx-auto max-w-4xl px-4 py-10 text-center">
        <h2 className="text-2xl font-bold text-brand-600">Misión</h2>
        <p className="mt-2 text-ink-700">
          Cumplir el deseo de nuestros clientes en productos de moda y estilo, brindando una experiencia de
          compra única y un alto servicio de calidad.
        </p>
      </section>
      <section id="vision" className="mx-auto max-w-4xl px-4 py-10 text-center">
        <h2 className="text-2xl font-bold text-brand-600">Visión</h2>
        <p className="mt-2 text-ink-700">
          Ser la opción preferida de compra e inspiración de moda para nuestros clientes, con sólidos
          recursos que permitan proyectarse a un crecimiento sostenible.
        </p>
      </section>
      <section id="valores" className="mx-auto max-w-4xl px-4 py-10 text-center">
        <h2 className="text-2xl font-bold text-brand-600">Valores Corporativos</h2>
        <p className="mt-2 text-ink-700">Compromiso · Innovación · Trabajo en equipo · Servicio al cliente · Calidad · Honestidad</p>
      </section>

      <PromoSection />
      <Footer />

      <WhatsAppButton />
      <ChatWidget />
    </div>
  );
}
