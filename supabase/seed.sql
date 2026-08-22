-- =========================================================
-- COMECSA STORE - Seed de ejemplo
-- Ejecutar DESPUES de supabase/schema.sql, en el SQL Editor de Supabase.
-- Datos de muestra para poder ver la tienda y el panel admin funcionando;
-- reemplaza estos productos y clientes por los reales de COMECSA.
-- =========================================================

-- Productos de catálogo (varios por categoría, con las imágenes
-- publicadas hoy en https://comecsa.ec — reemplázalas subiendo fotos propias
-- desde el panel admin cuando las tengas, ver nota en README.md).
insert into products (name, slug, description, category, status, image_url, cost_usd, margin_pct, price_usd, sizes, stock_quantity, is_published)
values
  -- Calzado
  ('Zapato casual unisex', 'zapato-casual-unisex', 'Calzado cómodo para uso diario, disponible en varias tallas.', 'calzado', 'disponible', 'https://comecsa.ec/calzado.jpg', 18, 45, 26.10, '35, 36, 37, 38, 39, 40, 41, 42', 20, true),
  ('Zapatillas deportivas unisex', 'zapatillas-deportivas-unisex', 'Zapatillas ligeras para uso diario y deporte casual.', 'calzado', 'disponible', 'https://comecsa.ec/calzado.jpg', 25, 40, 35.00, '35, 36, 37, 38, 39, 40, 41, 42', 25, true),
  ('Zapatos de dama tacón', 'zapatos-de-dama-tacon', 'Zapatos de tacón para dama, ideales para toda ocasión.', 'calzado', 'disponible', 'https://comecsa.ec/calzado.jpg', 20, 50, 30.00, '35, 36, 37, 38, 39, 40', 18, true),
  -- Ropa
  ('Camiseta básica algodón', 'camiseta-basica-algodon', 'Camiseta de algodón para toda la familia, varios colores.', 'ropa', 'disponible', 'https://comecsa.ec/ropa.jpg', 6, 60, 9.60, 'S, M, L, XL', 40, true),
  ('Buzo canguro unisex', 'buzo-canguro-unisex', 'Buzo con capucha y bolsillo canguro, ideal para clima fresco.', 'ropa', 'disponible', 'https://comecsa.ec/ropa.jpg', 14, 55, 21.70, 'S, M, L, XL', 30, true),
  -- Accesorios
  ('Gorra unisex ajustable', 'gorra-unisex-ajustable', 'Gorra con cierre ajustable, varios colores disponibles.', 'accesorios', 'disponible', 'https://comecsa.ec/accesorios.png', 5, 60, 8.00, 'Talla única', 35, true),
  ('Bolso de mano', 'bolso-de-mano', 'Accesorio de moda para complementar cualquier outfit.', 'accesorios', 'disponible', 'https://comecsa.ec/accesorios.png', 12, 50, 18.00, null, 15, true),
  -- Hogar
  ('Set de vajilla 16 piezas', 'set-vajilla-16-piezas', 'Juego de vajilla para el hogar, resistente y de uso diario.', 'hogar', 'disponible', 'https://comecsa.ec/Hogar.jpg', 22, 35, 29.70, null, 10, true)
on conflict (slug) do nothing;

-- Configuración del negocio (datos de contacto en blanco: complétalos en /admin/configuracion)
insert into business_settings (id, business_name)
values (1, 'COMECSA')
on conflict (id) do update set business_name = excluded.business_name;

-- Cliente y pedido de ejemplo, para ver el CRM y el pipeline de pedidos con datos.
do $$
declare v_customer_id uuid;
declare v_product_id uuid;
begin
  insert into customers (full_name, channel, city)
  values ('Cliente de ejemplo', 'whatsapp', 'La Libertad')
  returning id into v_customer_id;

  select id into v_product_id from products where slug = 'zapato-casual-unisex';

  insert into orders (customer_id, product_id, item_name, price_usd, status, source)
  values (v_customer_id, v_product_id, 'Zapato casual unisex', 26.10, 'pendiente', 'admin');
end $$;

-- Movimientos financieros de ejemplo
insert into finance_entries (type, category, description, amount) values
  ('gasto', 'arriendo', 'Arriendo local La Libertad', 350),
  ('gasto', 'servicios', 'Agua y luz', 60),
  ('ingreso', 'venta', 'Venta mostrador', 120);
