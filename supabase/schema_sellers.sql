-- =========================================================
-- COMECSA STORE - Vendedores y comisiones por venta
-- =========================================================
-- Ejecutar DESPUES de schema.sql y schema_customer_accounts.sql
-- (usa la función is_staff() que crea ese script).

create table if not exists sellers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  commission_pct numeric(5,2) not null default 5,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_sellers_updated_at on sellers;
create trigger trg_sellers_updated_at before update on sellers
  for each row execute function set_updated_at();

alter table orders add column if not exists seller_id uuid references sellers(id) on delete set null;
create index if not exists idx_orders_seller on orders(seller_id);

alter table sellers enable row level security;

drop policy if exists "staff full access sellers" on sellers;
create policy "staff full access sellers" on sellers
  for all using (is_staff()) with check (is_staff());
