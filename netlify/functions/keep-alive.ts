import type { Config } from "@netlify/functions";

// Supabase (plan gratis) pausa el proyecto tras 7 días sin actividad en la
// base de datos. Esta función corre sola cada 3 días y hace una consulta
// liviana para que Supabase la vea como actividad real y nunca pause el
// proyecto — sin necesidad de tráfico real de clientes ni cuentas externas.
export default async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("keep-alive: faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  try {
    const res = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    console.log("keep-alive: ping a Supabase", res.status);
  } catch (err) {
    console.error("keep-alive: error al hacer ping a Supabase", err);
  }
};

export const config: Config = {
  // Cada 3 días a las 8am UTC — bien por debajo del límite de 7 días de Supabase.
  schedule: "0 8 */3 * *",
};
