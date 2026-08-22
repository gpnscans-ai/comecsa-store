-- =========================================================
-- COMECSA STORE - Códigos de descuento
-- =========================================================
-- Ejecutar DESPUES de schema.sql y schema_customer_accounts.sql
-- (usa is_staff() y set_updated_at() que crea ese script).

create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric(10,2) not null check (value > 0),
  active boolean not null default true,
  usage_limit integer,
  times_used integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_discount_codes_updated_at on discount_codes;
create trigger trg_discount_codes_updated_at before update on discount_codes
  for each row execute function set_updated_at();

alter table discount_codes enable row level security;

drop policy if exists "staff full access discount_codes" on discount_codes;
create policy "staff full access discount_codes" on discount_codes
  for all using (is_staff()) with check (is_staff());

-- Productos a los que aplica cada código. Sin filas = aplica a todo el catálogo.
create table if not exists discount_code_products (
  discount_code_id uuid not null references discount_codes(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  primary key (discount_code_id, product_id)
);

alter table discount_code_products enable row level security;

drop policy if exists "staff full access discount_code_products" on discount_code_products;
create policy "staff full access discount_code_products" on discount_code_products
  for all using (is_staff()) with check (is_staff());

-- Incremento atómico de uso (llamado por el checkout, con service role).
create or replace function increment_discount_usage(p_code text) returns void as $$
  update discount_codes set times_used = times_used + 1 where code = p_code;
$$ language sql security definer;
