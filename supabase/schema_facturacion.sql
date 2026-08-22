-- =========================================================
-- COMECSA STORE - Modulo de facturacion (Ecuador / SRI)
-- =========================================================
-- Ejecutar en Supabase SQL Editor DESPUES de schema.sql y seed.sql.
--
-- IMPORTANTE: esto genera comprobantes con el formato y numeracion
-- que exige el SRI (establecimiento-puntoEmision-secuencial, IVA,
-- datos del emisor), pero MIENTRAS el negocio no tenga firma
-- electronica y autorizacion del SRI para facturacion electronica,
-- estos documentos son de USO INTERNO / respaldo, no comprobantes
-- tributarios autorizados. Cuando tengan la firma electronica, se
-- conecta un proveedor certificado y estos mismos registros pasan
-- a emitirse y autorizarse ante el SRI sin cambiar la numeracion.

-- Agrega 'kushki' como metodo de pago (ademas de stripe/transferencia/efectivo/otro)
do $$ begin
  alter type payment_method add value if not exists 'kushki';
exception when duplicate_object then null; end $$;

do $$ begin
  create type invoice_doc_type as enum ('factura', 'nota_venta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invoice_status as enum ('borrador', 'emitida', 'anulada');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------
-- BUSINESS_SETTINGS (fila unica con los datos del emisor)
-- ---------------------------------------------------------
create table if not exists business_settings (
  id integer primary key default 1,
  business_name text not null default 'COMECSA',
  ruc text not null default '',
  regimen text not null default 'RIMPE',
  doc_type invoice_doc_type not null default 'nota_venta',
  address text,
  phone text,
  email text,
  establecimiento text not null default '001',
  punto_emision text not null default '001',
  iva_pct numeric(5,2) not null default 15,
  next_sequential integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint business_settings_singleton check (id = 1)
);

insert into business_settings (id, business_name)
values (1, 'COMECSA')
on conflict (id) do nothing;

drop trigger if exists trg_business_settings_updated_at on business_settings;
create trigger trg_business_settings_updated_at before update on business_settings
  for each row execute function set_updated_at();

-- Genera el siguiente numero de comprobante de forma atomica
-- (evita numeros duplicados si dos facturas se crean al mismo tiempo).
create or replace function next_invoice_number() returns text as $$
declare
  v_est text;
  v_pe text;
  v_seq integer;
begin
  update business_settings
  set next_sequential = next_sequential + 1
  where id = 1
  returning establecimiento, punto_emision, next_sequential - 1 into v_est, v_pe, v_seq;

  return v_est || '-' || v_pe || '-' || lpad(v_seq::text, 9, '0');
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------
-- INVOICES (facturas / notas de venta)
-- ---------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,     -- 001-001-000000001
  doc_type invoice_doc_type not null default 'nota_venta',
  order_id uuid references orders(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  customer_id_number text,                 -- cedula/RUC del cliente (opcional)
  customer_address text,
  items jsonb not null default '[]',       -- [{description, quantity, unit_price, subtotal}]
  subtotal numeric(10,2) not null default 0,
  iva_pct numeric(5,2) not null default 15,
  iva_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status invoice_status not null default 'emitida',
  notes text,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_invoices_customer on invoices(customer_id);
create index if not exists idx_invoices_order on invoices(order_id);
create index if not exists idx_invoices_issued on invoices(issued_at);

alter table business_settings enable row level security;
alter table invoices enable row level security;

drop policy if exists "admin full access business_settings" on business_settings;
create policy "admin full access business_settings" on business_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin full access invoices" on invoices;
create policy "admin full access invoices" on invoices
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
