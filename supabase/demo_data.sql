-- =========================================================
-- COMECSA STORE - Datos de DEMOSTRACIÓN (ficticios)
-- =========================================================
-- Solo para que las gráficas del Resumen (/admin) se vean pobladas
-- mientras enseñas el sitio. Cuando cargues datos reales, borra estos
-- clientes/pedidos de ejemplo desde /admin/clientes (son fáciles de
-- identificar: María Fernanda Suárez, Carlos Andrade, Lucía Ponce,
-- Jorge Reyes, Daniela Ochoa, Pedro Villamar).

do $$
declare
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid;
  o uuid;
begin
  insert into customers (full_name, channel, city) values ('María Fernanda Suárez', 'whatsapp', 'La Libertad') returning id into c1;
  insert into customers (full_name, channel, city) values ('Carlos Andrade', 'instagram', 'Salinas') returning id into c2;
  insert into customers (full_name, channel, city) values ('Lucía Ponce', 'facebook', 'La Libertad') returning id into c3;
  insert into customers (full_name, channel, city) values ('Jorge Reyes', 'tienda', 'Santa Elena') returning id into c4;
  insert into customers (full_name, channel, city) values ('Daniela Ochoa', 'referido', 'La Libertad') returning id into c5;
  insert into customers (full_name, channel, city) values ('Pedro Villamar', 'whatsapp', 'Salinas') returning id into c6;

  -- Pedidos repartidos en cada etapa del pipeline
  insert into orders (customer_id, item_name, price_usd, status, source) values (c1, 'Zapatillas deportivas unisex', 35.00, 'entregado', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 35.00, 'transferencia', now() - interval '5 months');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c2, 'Buzo canguro unisex', 21.70, 'entregado', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 21.70, 'efectivo', now() - interval '5 months' + interval '10 days');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c3, 'Zapatos de dama tacón', 30.00, 'entregado', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 30.00, 'transferencia', now() - interval '4 months');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c4, 'Camiseta básica algodón', 9.60, 'entregado', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 9.60, 'efectivo', now() - interval '4 months' + interval '15 days');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c5, 'Gorra unisex ajustable', 8.00, 'entregado', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 8.00, 'transferencia', now() - interval '3 months');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c1, 'Bolso de mano', 18.00, 'enviado', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 18.00, 'transferencia', now() - interval '3 months' + interval '12 days');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c6, 'Set de vajilla 16 piezas', 29.70, 'enviado', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 29.70, 'kushki', now() - interval '2 months');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c2, 'Zapato casual unisex', 26.10, 'listo_retiro', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 26.10, 'transferencia', now() - interval '2 months' + interval '18 days');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c3, 'Zapatillas deportivas unisex', 35.00, 'listo_retiro', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 35.00, 'payphone', now() - interval '1 months');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c4, 'Buzo canguro unisex', 21.70, 'en_preparacion', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 15.00, 'transferencia', now() - interval '1 months' + interval '8 days');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c5, 'Zapatos de dama tacón', 30.00, 'en_preparacion', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 30.00, 'efectivo', now() - interval '20 days');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c6, 'Camiseta básica algodón', 9.60, 'confirmado', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 9.60, 'transferencia', now() - interval '10 days');

  insert into orders (customer_id, item_name, price_usd, status, source) values (c1, 'Gorra unisex ajustable', 8.00, 'confirmado', 'admin') returning id into o;
  insert into payments (order_id, amount, method, paid_at) values (o, 5.00, 'efectivo', now() - interval '3 days');

  -- Pedidos sin pago todavía (pendientes), para variar el pipeline
  insert into orders (customer_id, item_name, price_usd, status, source) values (c2, 'Bolso de mano', 18.00, 'pendiente', 'admin');
  insert into orders (customer_id, item_name, price_usd, status, source) values (c3, 'Set de vajilla 16 piezas', 29.70, 'pendiente', 'admin');
end $$;
