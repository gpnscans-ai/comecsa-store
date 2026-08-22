export default function PromoSection() {
  return (
    <section className="bg-brand-700 py-16 text-center text-white">
      <div className="mx-auto max-w-xl px-4">
        <h2 className="text-3xl font-bold sm:text-4xl">Promociones Especiales</h2>
        <p className="mt-2 text-white/80">Descubre nuestras mejores ofertas</p>

        <form className="mt-8 space-y-4">
          <h3 className="text-lg font-medium">Suscríbete aquí y recibe nuestras promociones</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="email"
              placeholder="Ingresa tu correo electrónico"
              className="w-full max-w-sm rounded-full border-0 px-5 py-3 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-white sm:w-80"
            />
            <button type="submit" className="rounded-full bg-white px-10 py-3 font-semibold text-brand-600 shadow-lg transition hover:bg-white/90">
              Suscribirme
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
