"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CustomerChannel } from "@/types/database";

export async function upsertCustomer(formData: FormData) {
  const supabase = await createServerSupabase();

  const id = String(formData.get("id") || "");
  const payload = {
    full_name: String(formData.get("full_name") || "").trim(),
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    whatsapp: String(formData.get("whatsapp") || "").trim() || null,
    instagram: String(formData.get("instagram") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    channel: (String(formData.get("channel") || "otro") as CustomerChannel),
    notes: String(formData.get("notes") || "").trim() || null,
  };

  if (!payload.full_name) throw new Error("El nombre es obligatorio");

  if (id) {
    const { error } = await supabase.from("customers").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath(`/admin/clientes/${id}`);
    revalidatePath("/admin/clientes");
    redirect(`/admin/clientes/${id}`);
  } else {
    const { data, error } = await supabase.from("customers").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    revalidatePath("/admin/clientes");
    redirect(`/admin/clientes/${data.id}`);
  }
}
