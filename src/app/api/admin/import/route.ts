import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { parseSpreadsheet, pick, toBool, toNumber } from "@/lib/importParser";
import { slugify } from "@/lib/utils";
import type { CustomerChannel, FinanceType, OrderStatus, ProductCategory, ProductStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type ImportType = "clientes" | "productos" | "vendedores" | "finanzas" | "pedidos" | "facturas";
const VALID_TYPES: ImportType[] = ["clientes", "productos", "vendedores", "finanzas", "pedidos", "facturas"];

const CHANNELS: CustomerChannel[] = ["whatsapp", "instagram", "facebook", "tienda", "referido", "otro"];
const CATEGORIES: ProductCategory[] = ["calzado", "ropa", "hogar", "accesorios", "tecnologia", "juguetes", "otro"];
const PRODUCT_STATUSES: ProductStatus[] = ["disponible", "agotado", "archivado"];
const ORDER_STATUSES: OrderStatus[] = ["pendiente", "confirmado", "en_preparacion", "listo_retiro", "enviado", "entregado", "cancelado"];

function matchEnum<T extends string>(value: string, options: T[], fallback: T): T {
  const norm = value.toLowerCase().trim();
  const found = options.find((o) => o === norm || o.replace("_", " ") === norm);
  return found ?? fallback;
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "staff"].includes(profile.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const type = String(form.get("type") || "") as ImportType;
  const file = form.get("file") as File | null;

  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "Tipo de importación inválido" }, { status: 400 });
  if (!file) return NextResponse.json({ error: "Selecciona un archivo" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: Record<string, string>[];
  try {
    rows = await parseSpreadsheet(buffer, file.name);
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo. Verifica que sea .xlsx o .csv válido." }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "El archivo no tiene filas con datos" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const result = { total: rows.length, imported: 0, skipped: 0, errors: [] as string[] };

  if (type === "clientes") await importClientes(admin, rows, result);
  else if (type === "productos") await importProductos(admin, rows, result);
  else if (type === "vendedores") await importVendedores(admin, rows, result);
  else if (type === "finanzas") await importFinanzas(admin, rows, result);
  else if (type === "pedidos") await importPedidos(admin, rows, result);
  else if (type === "facturas") await importFacturas(admin, rows, result);

  return NextResponse.json(result);
}

type Result = { total: number; imported: number; skipped: number; errors: string[] };

async function importClientes(admin: ReturnType<typeof createAdminSupabase>, rows: Record<string, string>[], result: Result) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const full_name = pick(row, "nombre", "nombre_completo", "cliente", "full_name", "name");
    if (!full_name) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2}: falta el nombre`);
      continue;
    }
    const payload = {
      full_name,
      email: pick(row, "correo", "email", "correo_electronico") || null,
      phone: pick(row, "telefono", "phone", "celular") || null,
      whatsapp: pick(row, "whatsapp") || null,
      instagram: pick(row, "instagram") || null,
      address: pick(row, "direccion", "address") || null,
      city: pick(row, "ciudad", "city") || null,
      channel: matchEnum(pick(row, "canal", "channel") || "otro", CHANNELS, "otro"),
      notes: pick(row, "notas", "notes", "observaciones") || null,
    };
    const { error } = await admin.from("customers").insert(payload);
    if (error) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2} (${full_name}): ${error.message}`);
    } else {
      result.imported++;
    }
  }
}

async function importProductos(admin: ReturnType<typeof createAdminSupabase>, rows: Record<string, string>[], result: Result) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = pick(row, "nombre", "producto", "name");
    const priceStr = pick(row, "precio", "precio_usd", "price", "price_usd");
    if (!name || !priceStr) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2}: falta nombre o precio`);
      continue;
    }
    const payload = {
      name,
      slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`,
      category: matchEnum(pick(row, "categoria", "category") || "otro", CATEGORIES, "otro"),
      status: matchEnum(pick(row, "estado", "status") || "disponible", PRODUCT_STATUSES, "disponible"),
      cost_usd: toNumber(pick(row, "costo", "costo_usd", "cost_usd"), 0) || null,
      margin_pct: toNumber(pick(row, "margen", "margen_pct", "margin_pct"), 0),
      price_usd: toNumber(priceStr, 0),
      deposit_pct: toNumber(pick(row, "abono", "abono_pct", "deposit_pct"), 0),
      sizes: pick(row, "tallas", "sizes") || null,
      stock_quantity: Math.round(toNumber(pick(row, "stock", "stock_quantity", "cantidad"), 0)),
      is_published: toBool(pick(row, "publicado", "is_published"), true),
      image_url: pick(row, "imagen", "image_url", "foto") || null,
      source_url: pick(row, "link", "source_url", "referencia") || null,
    };
    const { error } = await admin.from("products").insert(payload);
    if (error) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2} (${name}): ${error.message}`);
    } else {
      result.imported++;
    }
  }
}

async function importVendedores(admin: ReturnType<typeof createAdminSupabase>, rows: Record<string, string>[], result: Result) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const full_name = pick(row, "nombre", "vendedor", "full_name", "name");
    if (!full_name) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2}: falta el nombre`);
      continue;
    }
    const payload = {
      full_name,
      commission_pct: toNumber(pick(row, "comision", "comision_pct", "commission_pct"), 0),
      active: toBool(pick(row, "activo", "active"), true),
    };
    const { error } = await admin.from("sellers").insert(payload);
    if (error) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2} (${full_name}): ${error.message}`);
    } else {
      result.imported++;
    }
  }
}

async function importFinanzas(admin: ReturnType<typeof createAdminSupabase>, rows: Record<string, string>[], result: Result) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const amountStr = pick(row, "monto", "amount", "valor");
    if (!amountStr) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2}: falta el monto`);
      continue;
    }
    const typeRaw = pick(row, "tipo", "type") || "gasto";
    const type: FinanceType = typeRaw.toLowerCase().includes("ingreso") ? "ingreso" : "gasto";
    const dateStr = pick(row, "fecha", "entry_date", "date");
    const parsedDate = dateStr ? new Date(dateStr) : new Date();
    const classRaw = pick(row, "clasificacion", "clasificación", "expense_class").toLowerCase();
    const expense_class =
      type === "gasto" ? (classRaw.includes("impuesto") ? "impuesto" : classRaw.includes("otro") ? "otro" : "operativo") : null;
    const payload = {
      type,
      category: pick(row, "categoria", "category") || "otro",
      description: pick(row, "descripcion", "description") || null,
      amount: Math.abs(toNumber(amountStr, 0)),
      entry_date: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString().slice(0, 10) : parsedDate.toISOString().slice(0, 10),
      expense_class,
    };
    const { error } = await admin.from("finance_entries").insert(payload);
    if (error) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2}: ${error.message}`);
    } else {
      result.imported++;
    }
  }
}

async function findOrCreateCustomer(admin: ReturnType<typeof createAdminSupabase>, row: Record<string, string>): Promise<string | null> {
  const full_name = pick(row, "cliente", "customer", "nombre_cliente");
  if (!full_name) return null;
  const whatsapp = pick(row, "whatsapp", "whatsapp_cliente") || null;
  const email = pick(row, "correo_cliente", "email_cliente", "correo", "email") || null;

  let existing = null as { id: string } | null;
  if (whatsapp) {
    const { data } = await admin.from("customers").select("id").eq("whatsapp", whatsapp).maybeSingle();
    existing = data;
  }
  if (!existing && email) {
    const { data } = await admin.from("customers").select("id").eq("email", email).maybeSingle();
    existing = data;
  }
  if (!existing) {
    const { data } = await admin.from("customers").select("id").eq("full_name", full_name).maybeSingle();
    existing = data;
  }
  if (existing) return existing.id;

  const { data: created, error } = await admin
    .from("customers")
    .insert({ full_name, whatsapp, email, channel: "otro" as CustomerChannel })
    .select("id")
    .single();
  if (error) return null;
  return created.id;
}

async function findSellerId(admin: ReturnType<typeof createAdminSupabase>, row: Record<string, string>): Promise<string | null> {
  const name = pick(row, "vendedor", "seller");
  if (!name) return null;
  const { data } = await admin.from("sellers").select("id").ilike("full_name", name).maybeSingle();
  return data?.id ?? null;
}

async function importPedidos(admin: ReturnType<typeof createAdminSupabase>, rows: Record<string, string>[], result: Result) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const item_name = pick(row, "producto", "item_name", "articulo");
    const priceStr = pick(row, "precio", "precio_usd", "price_usd");
    if (!item_name || !priceStr) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2}: falta producto o precio`);
      continue;
    }
    const customer_id = await findOrCreateCustomer(admin, row);
    if (!customer_id) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2}: falta el cliente (columna "cliente")`);
      continue;
    }
    const seller_id = await findSellerId(admin, row);
    const payload = {
      customer_id,
      seller_id,
      item_name,
      price_usd: toNumber(priceStr, 0),
      status: matchEnum(pick(row, "estado", "status") || "pendiente", ORDER_STATUSES, "pendiente"),
      internal_notes: pick(row, "notas", "notes") || null,
      source: "admin" as const,
    };
    const { error } = await admin.from("orders").insert(payload);
    if (error) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2} (${item_name}): ${error.message}`);
    } else {
      result.imported++;
    }
  }
}

async function importFacturas(admin: ReturnType<typeof createAdminSupabase>, rows: Record<string, string>[], result: Result) {
  const { data: settings } = await admin.from("business_settings").select("*").eq("id", 1).single();
  if (!settings) {
    result.errors.push("No se encontró la configuración del negocio (business_settings)");
    return;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const customer_name = pick(row, "cliente", "customer_name");
    const description = pick(row, "descripcion", "item_description", "detalle") || "Producto";
    const quantity = toNumber(pick(row, "cantidad", "quantity"), 1) || 1;
    const unit_price = toNumber(pick(row, "precio_unitario", "unit_price", "precio"), 0);

    if (!customer_name || unit_price <= 0) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2}: falta cliente o precio unitario`);
      continue;
    }

    const subtotal = Math.round(quantity * unit_price * 100) / 100;
    const iva_pct = Number(settings.iva_pct);
    const iva_amount = Math.round(subtotal * (iva_pct / 100) * 100) / 100;
    const total = Math.round((subtotal + iva_amount) * 100) / 100;

    const { data: numberData, error: numberError } = await admin.rpc("next_invoice_number");
    if (numberError || !numberData) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2}: no se pudo generar el número de comprobante`);
      continue;
    }

    const payload = {
      invoice_number: numberData as string,
      doc_type: settings.doc_type,
      customer_name,
      customer_id_number: pick(row, "identificacion", "customer_id_number") || null,
      customer_address: pick(row, "direccion", "customer_address") || null,
      items: [{ description, quantity, unit_price, subtotal }],
      subtotal,
      iva_pct,
      iva_amount,
      total,
      notes: pick(row, "notas", "notes") || null,
    };

    const { error } = await admin.from("invoices").insert(payload);
    if (error) {
      result.skipped++;
      result.errors.push(`Fila ${i + 2} (${customer_name}): ${error.message}`);
    } else {
      result.imported++;
    }
  }
}
