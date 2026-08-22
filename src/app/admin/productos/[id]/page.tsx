import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: product } = await supabase.from("products").select("*").eq("id", id).single();
  if (!product) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold">{product.name}</h1>
      <ProductForm product={product} />
    </div>
  );
}
