import CustomerForm from "@/components/admin/CustomerForm";

export default function NuevoClientePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Nuevo cliente</h1>
      <CustomerForm />
    </div>
  );
}
