import { PRODUCT_CATEGORY_LABEL, type ProductCategory } from "@/types/database";

export type NavChild = { href: string; label: string };
export type NavItem = { href: string; label: string; icon: string; children?: NavChild[] };

const CATEGORY_ORDER: ProductCategory[] = ["calzado", "ropa", "hogar", "accesorios", "tecnologia", "juguetes", "otro"];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: "📊" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "📦" },
  { href: "/admin/clientes", label: "Clientes (CRM)", icon: "👥" },
  {
    href: "/admin/productos",
    label: "Catálogo",
    icon: "🛍️",
    children: [
      { href: "/admin/productos", label: "Todas las categorías" },
      ...CATEGORY_ORDER.map((c) => ({ href: `/admin/productos?categoria=${c}`, label: PRODUCT_CATEGORY_LABEL[c] })),
    ],
  },
  { href: "/admin/vendedores", label: "Vendedores", icon: "🧑‍💼" },
  { href: "/admin/promociones", label: "Promociones", icon: "📣" },
  { href: "/admin/finanzas", label: "Finanzas", icon: "💰" },
  { href: "/admin/facturas", label: "Facturas", icon: "🧾" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️" },
];
