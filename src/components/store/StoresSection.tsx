"use client";

import dynamic from "next/dynamic";
import { STORES } from "@/data/stores";

const StoresMap = dynamic(() => import("./StoresMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] items-center justify-center rounded-2xl bg-ink-100 text-sm text-ink-700/50">
      Cargando mapa...
    </div>
  ),
});

export default function StoresSection() {
  return (
    <section id="sucursales" className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold text-ink-900 sm:text-4xl">Nuestras Sucursales</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-ink-700/60">
          Visítanos en cualquiera de nuestros puntos de venta a nivel nacional.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {STORES.map((s) => (
              <div key={s.city} className="card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-ink-900">
                      <span className="text-brand-600">📍</span> {s.city}
                    </p>
                    <p className="text-sm text-ink-700/60">{s.province}, {s.country}</p>
                  </div>
                  {s.isMain && <span className="badge bg-brand-50 text-brand-700">Matriz</span>}
                </div>

                <p className="text-sm font-medium text-ink-800">{s.name}</p>

                <div className="space-y-1 text-xs text-ink-700/50">
                  <p>Dirección: {s.address || "Información próximamente"}</p>
                  <p>Teléfono: {s.phone || "Información próximamente"}</p>
                  <p>Horario: {s.hours || "Información próximamente"}</p>
                </div>

                <a
                  href={s.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary mt-auto justify-center text-sm"
                >
                  Ver ubicación
                </a>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-ink-200 shadow-sm">
            <StoresMap />
          </div>
        </div>
      </div>
    </section>
  );
}
