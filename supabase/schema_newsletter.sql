-- =========================================================
-- COMECSA STORE - Suscriptores y campañas de promociones
-- =========================================================
-- Ejecutar DESPUES de schema.sql y schema_customer_accounts.sql
-- (usa la función is_staff() que crea ese script).

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  unsubscribe_token uuid not null default gen_random_uuid(),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table if not exists newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  recipients_count integer not null default 0,
  sent_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;
alter table newsletter_campaigns enable row level security;

drop policy if exists "staff full access newsletter_subscribers" on newsletter_subscribers;
create policy "staff full access newsletter_subscribers" on newsletter_subscribers
  for all using (is_staff()) with check (is_staff());

drop policy if exists "staff full access newsletter_campaigns" on newsletter_campaigns;
create policy "staff full access newsletter_campaigns" on newsletter_campaigns
  for all using (is_staff()) with check (is_staff());
