"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { OrderStatus, PaymentMethod } from "@/types/database";

export async function createOrder(formData: FormData) {
  const supabase = await createServerSupabase();

  const payload = {
    customer_id: String(formData.get("customer_id") || ""),
    product_id: String(formData.get("product_id") || "") || null,
    seller_id: String(formData.get("seller_id") || "") || null,
    item_name: String(formData.get("item_name") || "").trim(),
    price_usd: Number(formData.get("price_usd") || 0),
    internal_notes: String(formData.get("internal_notes") || "").trim() || null,
    source: "admin" as const,
  };

  if (!payload.customer_id) throw new Error("Selecciona un cliente");
  if (!payload.item_name) throw new Error("El nombre del producto es obligatorio");

  if (payload.product_id) {
    const { error: stockError } = await supabase.rpc("decrement_stock_for_order", {
      p_items: [{ product_id: payload.product_id, quantity: 1 }],
    });
    // Solo bloqueamos por falta real de stock; cualquier otro error (ej. falta
    // correr la migración) se ignora para no impedir registrar el pedido.
    if (stockError && stockError.message.includes("insufficient_stock")) {
      throw new Error("Ya no queda stock de ese producto");
    }
  }

  const { data, error } = await supabase.from("orders").insert(payload).select("id").single();
  if (error) throw new Error(error.message);

  const deposit = Number(formData.get("initial_deposit") || 0);
  if (deposit > 0) {
    await supabase.from("payments").insert({
      order_id: data.id,
      amount: deposit,
      method: (String(formData.get("deposit_method") || "otro") as PaymentMethod),
    });
    await supabase.from("orders").update({ status: "confirmado" }).eq("id", data.id);
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/clientes/${payload.customer_id}`);
  redirect(`/admin/pedidos/${data.id}`);
}

export async function updateOrder(formData: FormData) {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Pedido inválido");

  const { data: existing } = await supabase.from("orders").select("status, product_id").eq("id", id).single();

  const payload = {
    item_name: String(formData.get("item_name") || "").trim(),
    price_usd: Number(formData.get("price_usd") || 0),
    status: (String(formData.get("status") || "pendiente") as OrderStatus),
    seller_id: String(formData.get("seller_id") || "") || null,
    tracking_number: String(formData.get("tracking_number") || "").trim() || null,
    tracking_carrier: String(formData.get("tracking_carrier") || "").trim() || null,
    shipping_notes: String(formData.get("shipping_notes") || "").trim() || null,
    internal_notes: String(formData.get("internal_notes") || "").trim() || null,
  };

  const { error } = await supabase.from("orders").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  // Si el pedido se acaba de cancelar (y no lo estaba ya), se devuelve la unidad al stock.
  if (existing && existing.status !== "cancelado" && payload.status === "cancelado" && existing.product_id) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity, status")
      .eq("id", existing.product_id)
      .maybeSingle();
    if (product) {
      await supabase
        .from("products")
        .update({
          stock_quantity: product.stock_quantity + 1,
          status: product.status === "agotado" ? "disponible" : product.status,
        })
        .eq("id", existing.product_id);
    }
  }

  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/pedidos");
  redirect(`/admin/pedidos/${id}`);
}

export async function addPayment(formData: FormData) {
  const supabase = await createServerSupabase();
  const orderId = String(formData.get("order_id") || "");
  const amount = Number(formData.get("amount") || 0);
  const method = (String(formData.get("method") || "otro") as PaymentMethod);

  if (!orderId || amount <= 0) throw new Error("Monto inválido");

  const { error } = await supabase.from("payments").insert({ order_id: orderId, amount, method });
  if (error) throw new Error(error.message);

  const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).single();
  if (order?.status === "pendiente") {
    await supabase.from("orders").update({ status: "confirmado" }).eq("id", orderId);
  }

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
}

export async function deletePayment(formData: FormData) {
  const supabase = await createServerSupabase();
  const paymentId = String(formData.get("payment_id") || "");
  const orderId = String(formData.get("order_id") || "");
  await supabase.from("payments").delete().eq("id", paymentId);
  revalidatePath(`/admin/pedidos/${orderId}`);
}
