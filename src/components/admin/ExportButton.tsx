type ExportType = "clientes" | "pedidos" | "productos" | "finanzas";

export default function ExportButton({ type }: { type: ExportType }) {
  return (
    <a href={`/api/admin/export?type=${type}`} className="btn-secondary" download>
      ⬇ Exportar a Excel
    </a>
  );
}
