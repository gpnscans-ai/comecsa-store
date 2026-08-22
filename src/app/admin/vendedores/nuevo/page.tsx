import SellerForm from "@/components/admin/SellerForm";

export default function NuevoVendedorPage() {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold">Nuevo vendedor</h1>
      <SellerForm />
    </div>
  );
}
