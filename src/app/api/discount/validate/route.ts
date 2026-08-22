import { NextResponse } from "next/server";
import { validateDiscountCode, type DiscountCartItem } from "@/lib/discounts";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const code = String(json?.code || "");
    const items: DiscountCartItem[] = Array.isArray(json?.items)
      ? json.items
          .map((i: any) => ({
            productId: String(i.productId || ""),
            priceUsd: Number(i.priceUsd),
            quantity: Number(i.quantity),
          }))
          .filter((i: DiscountCartItem) => i.productId && Number.isFinite(i.priceUsd) && Number.isFinite(i.quantity))
      : [];

    const result = await validateDiscountCode(code, items);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, error: "Error al validar el código" }, { status: 500 });
  }
}
