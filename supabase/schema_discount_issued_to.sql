-- =========================================================
-- COMECSA STORE - Códigos de descuento personalizados por cliente
-- =========================================================
-- Ejecutar DESPUES de schema_discounts.sql.

alter table discount_codes add column if not exists issued_to_email text;
