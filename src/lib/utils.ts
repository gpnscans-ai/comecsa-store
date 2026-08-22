export function formatUSD(amount: number | null | undefined) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount ?? 0);
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-EC", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// Precio sugerido = costo en USD * (1 + margen%)
export function suggestedPriceUSD(costUsd: number, marginPct: number) {
  return Math.round(costUsd * (1 + marginPct / 100) * 100) / 100;
}

export function whatsappLink(number: string, message: string) {
  const clean = number.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
