-- =========================================================
-- COMECSA STORE - Cliente puede leer sus propios pagos
-- =========================================================
-- Ejecutar DESPUES de schema_customer_accounts.sql.
--
-- payments solo tenía la política "staff full access payments", así que
-- un cliente logueado no podía leer ni siquiera sus propios pagos (la
-- nueva página de detalle de pedido en /cuenta/pedidos/[id] necesita
-- mostrar "pagado" / "saldo pendiente" al cliente dueño del pedido).
-- Esta política se SUMA a la de staff, no la reemplaza.

drop policy if exists "customer read own payments" on payments;
create policy "customer read own payments" on payments
  for select using (
    order_id in (
      select id from orders where customer_id in (select id from customers where user_id = auth.uid())
    )
  );
