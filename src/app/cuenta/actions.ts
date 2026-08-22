"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function signUpCustomer(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const password = String(formData.get("password") || "");

  if (!fullName || !email || password.length < 6) {
    redirect(`/cuenta/registro?error=${encodeURIComponent("Completa nombre, correo y una contraseña de al menos 6 caracteres")}`);
  }

  const admin = createAdminSupabase();

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !created.user) {
    const message = error?.message === "A user with this email address has already been registered"
      ? "Ya existe una cuenta con ese correo. Intenta iniciar sesión."
      : error?.message || "No se pudo crear la cuenta";
    redirect(`/cuenta/registro?error=${encodeURIComponent(message)}`);
  }

  const userId = created.user.id;

  // Si ya existía como cliente invitado (compró antes sin cuenta), lo vinculamos en vez de duplicarlo.
  let existingId: string | null = null;
  if (whatsapp) {
    const { data } = await admin.from("customers").select("id").eq("whatsapp", whatsapp).is("user_id", null).maybeSingle();
    existingId = data?.id ?? null;
  }
  if (!existingId && email) {
    const { data } = await admin.from("customers").select("id").eq("email", email).is("user_id", null).maybeSingle();
    existingId = data?.id ?? null;
  }

  if (existingId) {
    await admin
      .from("customers")
      .update({ user_id: userId, full_name: fullName, email, whatsapp: whatsapp || undefined })
      .eq("id", existingId);
  } else {
    await admin.from("customers").insert({
      user_id: userId,
      full_name: fullName,
      email,
      whatsapp: whatsapp || null,
      channel: "tienda",
    });
  }

  const supabase = await createServerSupabase();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    redirect("/cuenta/login");
  }

  redirect("/");
}

export async function signInCustomer(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/cuenta/login?error=${encodeURIComponent("Correo o contraseña incorrectos")}`);
  }

  redirect("/");
}

export async function signOutCustomer() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}
