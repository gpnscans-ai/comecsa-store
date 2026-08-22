-- =========================================================
-- COMECSA STORE - Cuentas de cliente (registro/login público)
-- =========================================================
-- Ejecutar DESPUES de schema.sql, schema_facturacion.sql,
-- schema_kushki.sql, schema_payphone.sql y schema_storage.sql.
--
-- IMPORTANTE: hasta ahora, las policies de "admin" en customers,
-- orders, products (escritura), payments, finance_entries,
-- invoices, business_settings y checkout_sessions usaban
-- auth.role() = 'authenticated' — es decir, CUALQUIER usuario
-- logueado tenía acceso total. Al agregar registro público de
-- clientes, eso se vuelve un hueco de seguridad real (un cliente
-- vería los pedidos y datos de todos los demás). Este script lo
-- corrige: solo el staff (tabla profiles) tiene acceso total, y
-- cada cliente solo puede ver/editar su propia fila.

-- ---------------------------------------------------------
-- Vincular clientes con su cuenta de Supabase Auth
-- ---------------------------------------------------------
alter table customers add column if not exists user_id uuid references auth.users(id) on delete set null;
create unique index if not exists idx_customers_user_id on customers(user_id) where user_id is not null;

-- ---------------------------------------------------------
-- Helper: ¿el usuario actual es staff (admin/staff)?
-- ---------------------------------------------------------
create or replace function is_staff() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('admin', 'staff')
  );
$$ language sql security definer stable;

-- ---------------------------------------------------------
-- PRODUCTS: la lectura pública ya existía; la escritura pasa a is_staff()
-- ---------------------------------------------------------
drop policy if exists "admin full access products" on products;
create policy "staff full access products" on products
  for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------
-- CUSTOMERS: staff ve todo; cada cliente solo su propia fila
-- ---------------------------------------------------------
drop policy if exists "admin full access customers" on customers;
create policy "staff full access customers" on customers
  for all using (is_staff()) with check (is_staff());

drop policy if exists "customer read own row" on customers;
create policy "customer read own row" on customers
  for select using (auth.uid() = user_id);

drop policy if exists "customer update own row" on customers;
create policy "customer update own row" on customers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------
-- ORDERS: staff ve todo; cada cliente solo sus propios pedidos
-- ---------------------------------------------------------
drop policy if exists "admin full access orders" on orders;
create policy "staff full access orders" on orders
  for all using (is_staff()) with check (is_staff());

drop policy if exists "customer read own orders" on orders;
create policy "customer read own orders" on orders
  for select using (customer_id in (select id from customers where user_id = auth.uid()));

-- ---------------------------------------------------------
-- Resto de tablas administrativas: solo staff
-- ---------------------------------------------------------
drop policy if exists "admin full access payments" on payments;
create policy "staff full access payments" on payments
  for all using (is_staff()) with check (is_staff());

drop policy if exists "admin full access finance" on finance_entries;
create policy "staff full access finance" on finance_entries
  for all using (is_staff()) with check (is_staff());

drop policy if exists "admin full access business_settings" on business_settings;
create policy "staff full access business_settings" on business_settings
  for all using (is_staff()) with check (is_staff());

drop policy if exists "admin full access invoices" on invoices;
create policy "staff full access invoices" on invoices
  for all using (is_staff()) with check (is_staff());

drop policy if exists "admin read checkout_sessions" on checkout_sessions;
create policy "staff read checkout_sessions" on checkout_sessions
  for select using (is_staff());

-- ---------------------------------------------------------
-- Da rol de staff a tu usuario admin actual (ajusta el correo si hace falta)
-- ---------------------------------------------------------
insert into profiles (id, role)
select id, 'admin' from auth.users where email = 'gpnscans@gmail.com'
on conflict (id) do update set role = 'admin';
