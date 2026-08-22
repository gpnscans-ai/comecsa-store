"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function upsertSeller(formData: FormData) {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") || "");
  const full_name = String(formData.get("full_name") || "").trim();

  if (!full_name) throw new Error("El nombre es obligatorio");

  const payload = {
    full_name,
    commission_pct: Number(formData.get("commission_pct") || 0),
    active: formData.get("active") === "on",
  };

  if (id) {
    const { error } = await supabase.from("sellers").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("sellers").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/vendedores");
  redirect("/admin/vendedores");
}

export async function archiveSeller(formData: FormData) {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") || "");
  await supabase.from("sellers").update({ active: false }).eq("id", id);
  revalidatePath("/admin/vendedores");
}
