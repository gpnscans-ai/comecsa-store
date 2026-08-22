import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { DEFAULT_IVA_PCT } from "@/lib/tax";

// Público de solo lectura: la tasa de IVA no es sensible y el visitante
// anónimo del carrito la necesita antes de iniciar sesión.
export async function GET() {
  const admin = createAdminSupabase();
  const { data } = await admin.from("business_settings").select("iva_pct").eq("id", 1).maybeSingle();
  return NextResponse.json({ iva_pct: data?.iva_pct != null ? Number(data.iva_pct) : DEFAULT_IVA_PCT });
}
