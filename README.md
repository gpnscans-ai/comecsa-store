# COMECSA Store

Tienda online de COMECSA: catálogo de ropa, calzado, accesorios y artículos para el hogar, carrito, buscador, apartados con abono, y panel de administración con CRM, pedidos, inventario, finanzas y facturación.

La apariencia de la tienda pública está calcada del sitio real [comecsa.ec](https://comecsa.ec) (colores, tipografía Poppins, estructura de topbar/hero/categorías/promociones/footer). Las imágenes del hero y de las categorías actualmente enlazan directo a `https://comecsa.ec/...` — si ese sitio cambia o quita esas fotos, se rompen. En cuanto tengas fotos propias, súbelas desde `/admin/productos` (usa el bucket de Supabase Storage, ver paso 6) y actualiza los enlaces en [`src/components/store/Hero.tsx`](src/components/store/Hero.tsx) y [`src/components/store/CategoryGrid.tsx`](src/components/store/CategoryGrid.tsx).

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind
- **Backend**: Next.js Route Handlers (API) + Supabase (Postgres + Auth)
- **Pagos**: Kushki / PayPhone / Stripe Checkout (el que esté configurado, en ese orden de prioridad)
- **Hosting**: Netlify

## 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo (elige la región más cercana, ej. US East). Este debe ser un proyecto **nuevo**, distinto al de Toychan.
2. En **Project Settings > API** copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (¡nunca la expongas al cliente!)
3. Ve a **SQL Editor > New query** y ejecuta en este orden el contenido de:
   1. [`supabase/schema.sql`](supabase/schema.sql)
   2. [`supabase/schema_facturacion.sql`](supabase/schema_facturacion.sql)
   3. [`supabase/schema_kushki.sql`](supabase/schema_kushki.sql) y [`supabase/schema_payphone.sql`](supabase/schema_payphone.sql)
   4. [`supabase/schema_storage.sql`](supabase/schema_storage.sql)
   5. (Opcional pero recomendado para empezar a ver algo) [`supabase/seed.sql`](supabase/seed.sql) — carga 4 productos de ejemplo (uno por categoría), un cliente y un pedido de muestra. Bórralos desde `/admin` cuando cargues el catálogo real.
4. Crea el usuario administrador: **Authentication > Users > Add user**, ingresa el correo y contraseña del panel. Ese es el login de `/admin`.
5. El bucket `product-images` para las fotos que subas desde el admin ya lo crea `schema_storage.sql`.

## 2. Variables de entorno

Copia `.env.example` a `.env.local` para desarrollo local, y carga las mismas variables en Netlify (**Site configuration > Environment variables**):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_CONTACT_PHONE=
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_SOCIAL_FACEBOOK=
NEXT_PUBLIC_SOCIAL_INSTAGRAM=
NEXT_PUBLIC_SOCIAL_TIKTOK=
```

`NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL` y `NEXT_PUBLIC_WHATSAPP_NUMBER` controlan lo que se muestra en la barra superior, el footer y el botón flotante de WhatsApp — mientras estén vacíos, esos elementos no se muestran (o muestran un aviso de "completa tus datos").

Pasarelas de pago (opcionales — sin ninguna configurada, la tienda sigue funcionando: los pedidos se guardan igual en el CRM y el abono se cobra manualmente por transferencia/efectivo desde el panel admin):

```
NEXT_PUBLIC_KUSHKI_PUBLIC_MERCHANT_ID=
KUSHKI_PRIVATE_MERCHANT_ID=
NEXT_PUBLIC_KUSHKI_ENV=uat
PAYPHONE_TOKEN=
PAYPHONE_STORE_ID=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

Chatbot y formulario de contacto (opcionales, gratis):

```
GEMINI_API_KEY=
RESEND_API_KEY=
CONTACT_EMAIL=
```

## 3. Desplegar en Netlify

1. Sube este proyecto a un repositorio de GitHub/GitLab.
2. En [app.netlify.com](https://app.netlify.com): **Add new site > Import an existing project**, conecta el repo. Este es un sitio Netlify **independiente** del de Toychan (`toychan-store.netlify.app`) — tendrá su propia URL, por ejemplo `comecsa-store.netlify.app`.
3. Netlify detecta `netlify.toml` automáticamente (build command `npm run build`, plugin `@netlify/plugin-nextjs`).
4. Agrega las variables de entorno del paso 2 en **Site configuration > Environment variables**.
5. Deploy. Cuando termine, copia la URL del sitio y complétala en `NEXT_PUBLIC_SITE_URL` (redeploy) y en el webhook de Stripe si lo usas (`https://TU-SITIO.netlify.app/api/webhook/stripe`, evento `checkout.session.completed`).

## 4. Correr en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` para la tienda y `http://localhost:3000/admin` para el panel (inicia sesión con el usuario creado en el paso 1.4).

## Estructura del panel admin

- **Resumen**: cuentas por cobrar, ingresos del mes, pedidos pendientes de confirmar, pedidos enviados.
- **Pedidos**: pipeline completo (pendiente → confirmado → en preparación → listo para retiro/enviado → entregado), tracking, abonos y saldos.
- **Clientes (CRM)**: contacto, canal, notas, historial de pedidos y saldo por cliente.
- **Catálogo**: productos publicados en la tienda (ropa, calzado, hogar, accesorios, tecnología, juguetes), costeo en USD con margen, tallas/números disponibles.
- **Finanzas**: gastos e ingresos del negocio (arriendo, servicios, deudas) además de las ventas cobradas.
- **Facturas**: notas de venta / facturas internas en PDF (uso interno hasta contar con firma electrónica del SRI, ver aviso en `/admin/configuracion`).
