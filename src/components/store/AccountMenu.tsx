"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signOutCustomer } from "@/app/cuenta/actions";

export default function AccountMenu() {
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadFromSession(session: { user: { id: string } } | null) {
      if (!session) {
        if (active) {
          setFirstName(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("customers")
        .select("full_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (active) {
        setFirstName(data?.full_name?.split(" ")[0] || "Mi cuenta");
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => loadFromSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => loadFromSession(session));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <span className="w-16 text-xs text-ink-700/30">···</span>;

  if (!firstName) {
    return (
      <Link href="/cuenta/login" className="text-xs text-ink-700/60 hover:text-brand-600">
        Iniciar sesión
      </Link>
    );
  }

  return (
    <div className="group relative">
      <button className="flex items-center gap-1 text-xs text-ink-700 hover:text-brand-600">
        Hola, {firstName} <span className="text-[10px]">▾</span>
      </button>
      <div className="invisible absolute right-0 top-full z-50 w-40 rounded-xl border border-ink-200 bg-white py-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
        <Link href="/cuenta" className="block px-4 py-2 text-sm text-ink-900 hover:bg-brand-50 hover:text-brand-600">
          Mi cuenta
        </Link>
        <form action={signOutCustomer}>
          <button type="submit" className="block w-full px-4 py-2 text-left text-sm text-ink-900 hover:bg-brand-50 hover:text-brand-600">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
