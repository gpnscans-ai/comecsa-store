-- =========================================================
-- COMECSA STORE - Corrección de seguridad: vistas SECURITY DEFINER
-- =========================================================
-- Ejecutar DESPUES de schema.sql y schema_customer_accounts.sql.
--
-- order_balances y customer_balances se crearon como vistas normales,
-- que en Postgres corren con los permisos de quien las CREÓ (bypasean el
-- RLS de orders/payments/customers), no con los de quien las consulta.
-- Esto significa que, tal como estaban, un cliente logueado (o incluso
-- un visitante anónimo, según los permisos por defecto de Supabase)
-- podía consultar estas vistas directo desde el navegador y ver el saldo
-- y los pagos de TODOS los clientes, no solo los suyos.
--
-- security_invoker = true hace que la vista respete el RLS de quien la
-- consulta: el admin sigue viendo todo (política is_staff), y un cliente
-- logueado solo ve lo que sus propias políticas de RLS en orders/payments
-- ya le permiten ver.

alter view order_balances set (security_invoker = true);
alter view customer_balances set (security_invoker = true);
