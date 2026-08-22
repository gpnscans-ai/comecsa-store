-- =========================================================
-- TOYCHAN STORE - Sesiones de checkout para PayPhone
-- =========================================================
-- Ejecutar en Supabase SQL Editor.
-- Guarda que pedidos/montos corresponden a cada intento de pago con
-- PayPhone, para poder marcarlos como pagados cuando el cliente vuelve
-- de la pagina de PayPhone (flujo de redireccion, como Stripe Checkout).

do $$ begin
  alter type payment_method add value if not exists 'payphone';
exception when duplicate_object then null; end $$;

create table if not exists checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'payphone',
  order_payments jsonb not null default '[]',  -- [{order_id, amount}]
  total numeric(10,2) not null default 0,
  status text not null default 'pending',       -- pending | completed | failed
  payphone_transaction_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_checkout_sessions_status on checkout_sessions(status);

alter table checkout_sessions enable row level security;

-- Sin policies publicas: solo se accede via service role desde las rutas de servidor.
drop policy if exists "admin read checkout_sessions" on checkout_sessions;
create policy "admin read checkout_sessions" on checkout_sessions
  for select using (auth.role() = 'authenticated');
