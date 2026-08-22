import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import SellerForm from "@/components/admin/SellerForm";

export const dynamic = "force-dynamic";

export default async function EditarVendedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: seller } = await supabase.from("sellers").select("*").eq("id", id).single();
  if (!seller) notFound();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold">{seller.full_name}</h1>
      <SellerForm seller={seller} />
    </div>
  );
}
