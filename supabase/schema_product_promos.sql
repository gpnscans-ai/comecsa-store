-- =========================================================
-- COMECSA STORE - Promociones por producto (catálogo)
-- =========================================================
-- Ejecutar DESPUES de schema.sql.

alter table products add column if not exists promo_active boolean not null default false;
alter table products add column if not exists promo_type text check (promo_type in ('percentage', 'fixed', '2x1'));
alter table products add column if not exists promo_value numeric(10,2);
