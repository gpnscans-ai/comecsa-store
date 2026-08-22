"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ProjectionYear } from "@/lib/financialEvaluation";

export async function saveProjection(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createServerSupabase();

  const initial_investment = Number(formData.get("initial_investment") || 0);
  const discount_rate_pct = Number(formData.get("discount_rate_pct") || 0);
  const profit_sharing_pct = Number(formData.get("profit_sharing_pct") || 15);
  const income_tax_pct = Number(formData.get("income_tax_pct") || 25);

  if (initial_investment <= 0) return { error: "Ingresa la inversión inicial" };
  if (discount_rate_pct <= 0 || discount_rate_pct >= 100) return { error: "Ingresa una tasa de descuento válida (entre 0 y 100)" };

  const years: ProjectionYear[] = [];
  for (let i = 1; i <= 5; i++) {
    years.push({
      revenue: Number(formData.get(`revenue_${i}`) || 0),
      variable_costs: Number(formData.get(`variable_costs_${i}`) || 0),
      fixed_costs: Number(formData.get(`fixed_costs_${i}`) || 0),
      depreciation: Number(formData.get(`depreciation_${i}`) || 0),
      amortization: Number(formData.get(`amortization_${i}`) || 0),
      loan_interest: Number(formData.get(`loan_interest_${i}`) || 0),
      loan_payment: Number(formData.get(`loan_payment_${i}`) || 0),
      salvage_value: Number(formData.get(`salvage_value_${i}`) || 0),
    });
  }

  const { error } = await supabase
    .from("financial_projection")
    .upsert({ id: 1, initial_investment, discount_rate_pct, profit_sharing_pct, income_tax_pct, years });
  if (error) return { error: error.message };

  revalidatePath("/admin/finanzas/proyeccion");
  return {};
}
