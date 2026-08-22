-- =========================================================
-- COMECSA STORE - Clasificación de gastos para el estado de resultados
-- =========================================================
-- Ejecutar DESPUES de schema.sql.
-- Permite separar los gastos en: operativo, otro, impuesto.
-- Los registros existentes (NULL) se tratan como "operativo" en el código.

alter table finance_entries add column if not exists expense_class text
  check (expense_class in ('operativo', 'otro', 'impuesto'));
