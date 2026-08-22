-- =========================================================
-- COMECSA STORE - Storage para imagenes de productos
-- =========================================================
-- Ejecutar en Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Lectura publica (para que las imagenes se vean en la tienda)
drop policy if exists "public read product-images" on storage.objects;
create policy "public read product-images" on storage.objects
  for select using (bucket_id = 'product-images');

-- Solo el admin autenticado puede subir/editar/borrar imagenes
drop policy if exists "admin write product-images" on storage.objects;
create policy "admin write product-images" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "admin update product-images" on storage.objects;
create policy "admin update product-images" on storage.objects
  for update using (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "admin delete product-images" on storage.objects;
create policy "admin delete product-images" on storage.objects
  for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');
