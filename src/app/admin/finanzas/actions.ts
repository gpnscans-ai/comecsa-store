"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ExpenseClass, FinanceType } from "@/types/database";

export async function createFinanceEntry(formData: FormData) {
  const supabase = await createServerSupabase();

  const type = String(formData.get("type") || "gasto") as FinanceType;

  const payload = {
    type,
    category: String(formData.get("category") || "otro").trim(),
    description: String(formData.get("description") || "").trim() || null,
    amount: Number(formData.get("amount") || 0),
    entry_date: String(formData.get("entry_date") || new Date().toISOString().slice(0, 10)),
    expense_class: type === "gasto" ? (String(formData.get("expense_class") || "operativo") as ExpenseClass) : null,
  };

  if (payload.amount <= 0) throw new Error("El monto debe ser mayor a 0");

  const { error } = await supabase.from("finance_entries").insert(payload);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/finanzas");
}

export async function deleteFinanceEntry(formData: FormData) {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") || "");
  await supabase.from("finance_entries").delete().eq("id", id);
  revalidatePath("/admin/finanzas");
}
