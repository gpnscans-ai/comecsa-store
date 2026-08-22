import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="relative flex min-h-[420px] items-center justify-center bg-brand-800 bg-cover bg-center text-center"
      style={{ backgroundImage: "url('https://comecsa.ec/edificio.png')" }}
    >
      <div className="absolute inset-0 bg-brand-900/60" />
      <div className="relative mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold text-white sm:text-6xl">
          Somos parte de tu estilo
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-white/85">
          Ropa, calzado, accesorios y artículos para el hogar para toda la familia, con más de 30 años de
          experiencia en Santa Elena.
        </p>
        <Link href="#catalogo" className="mt-8 inline-flex rounded-full bg-white px-10 py-4 font-semibold text-brand-600 shadow-lg transition hover:bg-white/90">
          Ver catálogo
        </Link>
      </div>
    </section>
  );
}
