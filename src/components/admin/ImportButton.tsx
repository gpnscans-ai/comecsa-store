"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImportType = "clientes" | "productos" | "vendedores" | "finanzas" | "pedidos" | "facturas";

const COLUMNS_HINT: Record<ImportType, string> = {
  clientes: "nombre, correo, telefono, whatsapp, instagram, direccion, ciudad, canal, notas",
  productos: "nombre, categoria, estado, costo, margen, precio, abono, tallas, stock, publicado, imagen, link",
  vendedores: "nombre, comision, activo",
  finanzas: "tipo (ingreso/gasto), clasificacion (operativo/otro/impuesto), categoria, descripcion, monto, fecha",
  pedidos: "cliente, whatsapp, producto, precio, estado, vendedor, notas",
  facturas: "cliente, identificacion, direccion, descripcion, cantidad, precio_unitario, notas",
};

type ImportResult = { total: number; imported: number; skipped: number; errors: string[] };

export default function ImportButton({ type }: { type: ImportType }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("file", file);
      const res = await fetch("/api/admin/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo importar el archivo");
      } else {
        setResult(data);
        router.refresh();
      }
    } catch {
      setError("Error de conexión al importar el archivo");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function close() {
    setOpen(false);
    setResult(null);
    setError(null);
  }

  return (
    <>
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
        ⬆ Importar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold">Importar desde Excel/CSV</h2>
                <p className="mt-1 text-xs text-ink-700/60">
                  Columnas reconocidas (no es necesario tener todas): {COLUMNS_HINT[type]}
                </p>
              </div>
              <button type="button" onClick={close} className="text-ink-700/50 hover:text-ink-900" aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="input"
                required
              />
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Importando..." : "Subir e importar"}
              </button>
            </form>

            {error && (
              <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
            )}

            {result && (
              <div className="mt-4 space-y-2 rounded-lg bg-brand-50 px-3 py-3 text-sm">
                <p>
                  <strong>{result.imported}</strong> de {result.total} filas importadas
                  {result.skipped > 0 && <span className="text-ink-700/60"> · {result.skipped} omitidas</span>}
                </p>
                {result.errors.length > 0 && (
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-ink-700/70">
                    {result.errors.slice(0, 20).map((err, i) => (
                      <li key={i}>· {err}</li>
                    ))}
                    {result.errors.length > 20 && <li>· y {result.errors.length - 20} más...</li>}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
