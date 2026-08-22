import { createClient } from "@supabase/supabase-js";

// Cliente con service role: SOLO usar en código de servidor (route handlers, webhooks, scripts).
// Se salta RLS por completo. Nunca importar desde un componente cliente.
export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
