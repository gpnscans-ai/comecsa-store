export type ProductCategory =
  | "calzado"
  | "ropa"
  | "hogar"
  | "accesorios"
  | "tecnologia"
  | "juguetes"
  | "otro";

export type ProductStatus = "disponible" | "agotado" | "archivado";

export type OrderStatus =
  | "pendiente"
  | "confirmado"
  | "en_preparacion"
  | "listo_retiro"
  | "enviado"
  | "entregado"
  | "cancelado";

export type PaymentMethod = "stripe" | "kushki" | "payphone" | "transferencia" | "efectivo" | "otro";
export type FinanceType = "gasto" | "ingreso";
export type CustomerChannel = "whatsapp" | "instagram" | "facebook" | "tienda" | "referido" | "otro";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: ProductCategory;
  status: ProductStatus;
  image_url: string | null;
  source_url: string | null;
  cost_usd: number | null;
  margin_pct: number;
  price_usd: number;
  deposit_pct: number;
  sizes: string | null;
  stock_quantity: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address: string | null;
  city: string | null;
  channel: CustomerChannel;
  notes: string | null;
  tags: string[];
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  product_id: string | null;
  seller_id: string | null;
  item_name: string;
  price_usd: number;
  status: OrderStatus;
  tracking_number: string | null;
  tracking_carrier: string | null;
  shipping_notes: string | null;
  internal_notes: string | null;
  source: "web" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: string;
  full_name: string;
  commission_pct: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  paid_at: string;
  created_at: string;
}

export interface FinanceEntry {
  id: string;
  type: FinanceType;
  category: string;
  description: string | null;
  amount: number;
  entry_date: string;
  created_at: string;
}

export interface OrderBalance {
  order_id: string;
  price_usd: number;
  paid_total: number;
  balance_due: number;
}

export interface CustomerBalance {
  customer_id: string;
  full_name: string;
  active_orders: number;
  total_balance_due: number;
  total_paid: number;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  listo_retiro: "Listo para retiro",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pendiente",
  "confirmado",
  "en_preparacion",
  "listo_retiro",
  "enviado",
  "entregado",
];

export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  calzado: "Calzado",
  ropa: "Ropa",
  hogar: "Artículos para el hogar",
  accesorios: "Accesorios",
  tecnologia: "Tecnología",
  juguetes: "Juguetes",
  otro: "Otro",
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  disponible: "Disponible",
  agotado: "Agotado",
  archivado: "Archivado",
};

// --- Facturación ---

export type InvoiceDocType = "factura" | "nota_venta";
export type InvoiceStatus = "borrador" | "emitida" | "anulada";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface BusinessSettings {
  id: number;
  business_name: string;
  ruc: string;
  regimen: string;
  doc_type: InvoiceDocType;
  address: string | null;
  phone: string | null;
  email: string | null;
  establecimiento: string;
  punto_emision: string;
  iva_pct: number;
  next_sequential: number;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  doc_type: InvoiceDocType;
  order_id: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_id_number: string | null;
  customer_address: string | null;
  items: InvoiceItem[];
  subtotal: number;
  iva_pct: number;
  iva_amount: number;
  total: number;
  status: InvoiceStatus;
  notes: string | null;
  issued_at: string;
  created_at: string;
}

export const INVOICE_DOC_TYPE_LABEL: Record<InvoiceDocType, string> = {
  factura: "Factura",
  nota_venta: "Nota de venta",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  borrador: "Borrador",
  emitida: "Emitida (uso interno)",
  anulada: "Anulada",
};

// --- Newsletter / Promociones ---

export interface NewsletterSubscriber {
  id: string;
  email: string;
  active: boolean;
  unsubscribe_token: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  body: string;
  recipients_count: number;
  sent_at: string;
}

// --- Códigos de descuento ---

export type DiscountType = "percentage" | "fixed";

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  active: boolean;
  usage_limit: number | null;
  times_used: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  percentage: "Porcentaje (%)",
  fixed: "Monto fijo ($)",
};
