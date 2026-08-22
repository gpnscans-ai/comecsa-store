export const DEFAULT_IVA_PCT = 15;

export function withIva(basePrice: number, ivaPct: number = DEFAULT_IVA_PCT): number {
  return Math.round(basePrice * (1 + ivaPct / 100) * 100) / 100;
}
