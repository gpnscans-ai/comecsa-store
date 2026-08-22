import type { CustomerChannel, OrderStatus } from "@/types/database";

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pendiente: "#9CA3AF",
  confirmado: "#FBBF24",
  en_preparacion: "#38BDF8",
  listo_retiro: "#A78BFA",
  enviado: "#818CF8",
  entregado: "#4ADE80",
  cancelado: "#F87171",
};

export const CHANNEL_COLOR: Record<CustomerChannel, string> = {
  whatsapp: "#34D399",
  instagram: "#F472B6",
  facebook: "#60A5FA",
  tienda: "#FBBF24",
  referido: "#A78BFA",
  otro: "#9CA3AF",
};

export const CATEGORICAL_PALETTE = [
  "#7259B8", // brand-400 (marca)
  "#38BDF8", // sky
  "#34D399", // emerald
  "#FBBF24", // amber
  "#A78BFA", // violet
  "#22D3EE", // cyan
  "#F472B6", // pink
  "#9CA3AF", // gray
];
