-- =========================================================
-- COMECSA STORE - Proyección de flujo de caja y evaluación financiera
-- =========================================================
-- Ejecutar DESPUES de schema.sql (usa set_updated_at() y is_staff()).
-- Tabla singleton (una sola fila, id=1) con los supuestos de la
-- proyección a 5 años: inversión inicial, tasa de descuento y, por año,
-- utilidad neta proyectada, depreciación, amortización, abono a capital
-- del préstamo y valor de salvamento.

create table if not exists financial_projection (
  id int primary key default 1,
  initial_investment numeric(12,2) not null default 0,
  discount_rate_pct numeric(5,2) not null default 10,
  profit_sharing_pct numeric(5,2) not null default 15,
  income_tax_pct numeric(5,2) not null default 25,
  years jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint financial_projection_singleton check (id = 1)
);

insert into financial_projection (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_financial_projection_updated_at on financial_projection;
create trigger trg_financial_projection_updated_at before update on financial_projection
  for each row execute function set_updated_at();

alter table financial_projection enable row level security;

drop policy if exists "staff full access financial_projection" on financial_projection;
create policy "staff full access financial_projection" on financial_projection
  for all using (is_staff()) with check (is_staff());
