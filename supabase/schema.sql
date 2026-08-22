-- =========================================================
-- COMECSA STORE - Esquema de base de datos (Supabase / Postgres)
-- =========================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- Este archivo es idempotente (se puede correr varias veces).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------
do $$ begin
  create type product_category as enum (
    'calzado', 'ropa', 'hogar', 'accesorios', 'tecnologia', 'juguetes', 'otro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_status as enum (
    'disponible', 'agotado', 'archivado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'pendiente',       -- cliente reservó/compró, puede o no haber pagado
    'confirmado',       -- pago confirmado o apartado aceptado en tienda
    'en_preparacion',   -- se está separando/empacando el pedido
    'listo_retiro',     -- listo para retirar en tienda
    'enviado',          -- despachado a domicilio (courier local)
    'entregado',        -- entregado al cliente final
    'cancelado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum (
    'stripe', 'kushki', 'payphone', 'transferencia', 'efectivo', 'otro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type finance_type as enum ('gasto', 'ingreso');
exception when duplicate_object then null; end $$;

do $$ begin
  create type customer_channel as enum ('whatsapp', 'instagram', 'facebook', 'tienda', 'referido', 'otro');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------
-- PROFILES (admin/staff que pueden entrar al dashboard)
-- ---------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- CUSTOMERS (CRM)
-- ---------------------------------------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  whatsapp text,
  instagram text,
  address text,
  city text,
  channel customer_channel not null default 'otro',
  notes text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_full_name on customers using gin (to_tsvector('spanish', full_name));

-- ---------------------------------------------------------
-- PRODUCTS (catálogo: ropa, calzado, hogar, accesorios...)
-- ---------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category product_category not null default 'otro',
  status product_status not null default 'disponible',
  image_url text,
  source_url text,               -- link de referencia (proveedor/mayorista)
  cost_usd numeric(12,2),        -- costo de compra en USD
  margin_pct numeric(6,2) not null default 30,     -- % de margen sobre costo
  price_usd numeric(10,2) not null default 0,      -- precio final de venta (editable manual)
  deposit_pct numeric(5,2) not null default 40,    -- % de abono requerido para apartar
  sizes text,                    -- tallas/números disponibles (texto libre, ej. "S, M, L, XL" o "38-42")
  stock_quantity integer not null default 1,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_status on products(status);
create index if not exists idx_products_published on products(is_published);

-- ---------------------------------------------------------
-- ORDERS (Pedidos) - una fila por producto pedido por un cliente
-- ---------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete restrict,
  product_id uuid references products(id) on delete set null,
  item_name text not null,          -- nombre del producto (denormalizado, por si es pedido custom)
  price_usd numeric(10,2) not null default 0,
  status order_status not null default 'pendiente',
  tracking_number text,
  tracking_carrier text,
  shipping_notes text,
  internal_notes text,
  source text not null default 'admin',   -- 'web' (compra pública) | 'admin' (cargado manual)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_status on orders(status);

-- ---------------------------------------------------------
-- PAYMENTS - abonos/pagos parciales o totales de un pedido
-- ---------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  amount numeric(10,2) not null,
  method payment_method not null default 'otro',
  stripe_session_id text,
  stripe_payment_intent text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_order on payments(order_id);

-- ---------------------------------------------------------
-- FINANCE LEDGER - gastos e ingresos generales del negocio
-- ---------------------------------------------------------
create table if not exists finance_entries (
  id uuid primary key default gen_random_uuid(),
  type finance_type not null,
  category text not null,          -- arriendo, servicios, deuda, envio, venta, otro...
  description text,
  amount numeric(10,2) not null,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_type_date on finance_entries(type, entry_date);

-- ---------------------------------------------------------
-- VISTA: saldo por pedido (precio - pagos)
-- ---------------------------------------------------------
create or replace view order_balances as
select
  o.id as order_id,
  o.price_usd,
  coalesce(sum(p.amount), 0) as paid_total,
  o.price_usd - coalesce(sum(p.amount), 0) as balance_due
from orders o
left join payments p on p.order_id = o.id
group by o.id, o.price_usd;

-- ---------------------------------------------------------
-- VISTA: saldo total por cliente
-- ---------------------------------------------------------
create or replace view customer_balances as
select
  c.id as customer_id,
  c.full_name,
  count(o.id) filter (where o.status <> 'cancelado') as active_orders,
  coalesce(sum(ob.balance_due) filter (where o.status <> 'cancelado'), 0) as total_balance_due,
  coalesce(sum(ob.paid_total), 0) as total_paid
from customers c
left join orders o on o.customer_id = c.id
left join order_balances ob on ob.order_id = o.id
group by c.id, c.full_name;

-- ---------------------------------------------------------
-- TRIGGERS updated_at
-- ---------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_customers_updated_at on customers;
create trigger trg_customers_updated_at before update on customers
  for each row execute function set_updated_at();

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- ---------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------
alter table profiles enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table finance_entries enable row level security;

-- Productos publicados: lectura pública (tienda)
drop policy if exists "public read published products" on products;
create policy "public read published products" on products
  for select using (is_published = true);

-- Todo lo demás: solo usuarios autenticados (dashboard admin)
drop policy if exists "admin full access products" on products;
create policy "admin full access products" on products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin full access customers" on customers;
create policy "admin full access customers" on customers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin full access orders" on orders;
create policy "admin full access orders" on orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin full access payments" on payments;
create policy "admin full access payments" on payments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin full access finance" on finance_entries;
create policy "admin full access finance" on finance_entries
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "self read profile" on profiles;
create policy "self read profile" on profiles
  for select using (auth.uid() = id);

-- Nota: las compras públicas (crear cliente + pedido desde la tienda) se hacen
-- vía API route de Next.js usando la service role key en el servidor, por lo
-- que NO necesitan policy pública de INSERT aquí (más seguro: se valida en el backend).
