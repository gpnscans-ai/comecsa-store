-- =========================================================
-- COMECSA STORE - Control de inventario automático
-- =========================================================
-- Ejecutar DESPUES de schema.sql.
-- Descuenta stock de forma atómica al confirmar un pedido (todo o nada:
-- si algún producto no tiene stock suficiente, no se descuenta nada) y
-- marca "agotado" automáticamente cuando llega a 0.

create or replace function decrement_stock_for_order(p_items jsonb)
returns void as $$
declare
  item jsonb;
  updated_rows integer;
  qty integer;
begin
  for item in select * from jsonb_array_elements(p_items)
  loop
    qty := (item->>'quantity')::integer;

    update products
    set
      stock_quantity = stock_quantity - qty,
      status = case when stock_quantity - qty <= 0 and status = 'disponible' then 'agotado' else status end
    where id = (item->>'product_id')::uuid
      and stock_quantity >= qty;

    get diagnostics updated_rows = row_count;
    if updated_rows = 0 then
      raise exception 'insufficient_stock:%', item->>'product_id';
    end if;
  end loop;
end;
$$ language plpgsql security definer;
