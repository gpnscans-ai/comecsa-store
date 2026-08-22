import ProductForm from "@/components/admin/ProductForm";

export default function NuevoProductoPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Nuevo producto</h1>
      <ProductForm />
    </div>
  );
}
