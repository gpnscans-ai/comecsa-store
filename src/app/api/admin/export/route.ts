import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExportType = "clientes" | "pedidos" | "productos" | "finanzas";

function filenameFor(type: ExportType) {
  const date = new Date().toISOString().slice(0, 10);
  const names: Record<ExportType, string> = {
    clientes: "comecsa-clientes",
    pedidos: "comecsa-pedidos",
    productos: "comecsa-catalogo",
    finanzas: "comecsa-finanzas",
  };
  return `${names[type]}-${date}.xlsx`;
}

function buildSheet(workbook: ExcelJS.Workbook, sheetName: string, rows: Record<string, unknown>[]) {
  const sheet = workbook.addWorksheet(sheetName);
  if (rows.length === 0) return sheet;

  const columns = Object.keys(rows[0]);
  sheet.columns = columns.map((key) => ({ header: key, key, width: Math.min(Math.max(key.length + 4, 14), 45) }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  return sheet;
}

export async function GET(req: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as ExportType | null;

  if (!type || !["clientes", "pedidos", "productos", "finanzas"].includes(type)) {
    return NextResponse.json({ error: "Tipo de exportación inválido" }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "COMECSA Store";
  workbook.created = new Date();

  if (type === "clientes") {
    const [{ data: customers }, { data: balances }] = await Promise.all([
      supabase.from("customers").select("*").order("full_name"),
      supabase.from("customer_balances").select("*"),
    ]);
    const balanceMap = new Map((balances || []).map((b: any) => [b.customer_id, b]));
    const rows = (customers || []).map((c: any) => {
      const bal = balanceMap.get(c.id);
      return {
        Nombre: c.full_name,
        Correo: c.email || "",
        WhatsApp: c.whatsapp || "",
        Teléfono: c.phone || "",
        Instagram: c.instagram || "",
        Ciudad: c.city || "",
        Dirección: c.address || "",
        Canal: c.channel,
        "Pedidos activos": bal?.active_orders ?? 0,
        "Total pagado": Number(bal?.total_paid ?? 0),
        "Saldo pendiente": Number(bal?.total_balance_due ?? 0),
        Notas: c.notes || "",
        "Creado el": c.created_at?.slice(0, 10) || "",
      };
    });
    buildSheet(workbook, "Clientes", rows);
  }

  if (type === "pedidos") {
    const [{ data: orders }, { data: orderBalances }] = await Promise.all([
      supabase
        .from("orders")
        .select("*, customer:customers(full_name, whatsapp)")
        .order("created_at", { ascending: false }),
      supabase.from("order_balances").select("order_id, paid_total, balance_due"),
    ]);
    const orderBalanceMap = new Map((orderBalances || []).map((b: any) => [b.order_id, b]));
    const rows = (orders || []).map((o: any) => ({
      Cliente: o.customer?.full_name || "",
      WhatsApp: o.customer?.whatsapp || "",
      Producto: o.item_name,
      "Precio USD": Number(o.price_usd),
      "Pagado USD": Number(orderBalanceMap.get(o.id)?.paid_total ?? 0),
      "Saldo USD": Number(orderBalanceMap.get(o.id)?.balance_due ?? o.price_usd),
      Estado: o.status,
      Tracking: o.tracking_number || "",
      Courier: o.tracking_carrier || "",
      Origen: o.source,
      "Notas envío": o.shipping_notes || "",
      "Notas internas": o.internal_notes || "",
      "Creado el": o.created_at?.slice(0, 10) || "",
    }));
    buildSheet(workbook, "Pedidos", rows);
  }

  if (type === "productos") {
    const { data: products } = await supabase.from("products").select("*").order("name");
    const rows = (products || []).map((p: any) => ({
      Nombre: p.name,
      Categoría: p.category,
      Estado: p.status,
      "Costo USD": p.cost_usd ? Number(p.cost_usd) : "",
      "Margen %": Number(p.margin_pct),
      "Precio USD": Number(p.price_usd),
      "Abono requerido %": Number(p.deposit_pct),
      Tallas: p.sizes || "",
      Stock: p.stock_quantity,
      Publicado: p.is_published ? "Sí" : "No",
      "Link referencia": p.source_url || "",
    }));
    buildSheet(workbook, "Catálogo", rows);
  }

  if (type === "finanzas") {
    const [{ data: entries }, { data: payments }] = await Promise.all([
      supabase.from("finance_entries").select("*").order("entry_date", { ascending: false }),
      supabase
        .from("payments")
        .select("amount, method, paid_at, order:orders(item_name, customer:customers(full_name))")
        .order("paid_at", { ascending: false }),
    ]);

    const gastosIngresos = (entries || []).map((e: any) => ({
      Fecha: e.entry_date,
      Tipo: e.type,
      Clasificación: e.type === "gasto" ? e.expense_class || "operativo" : "",
      Categoría: e.category,
      Descripción: e.description || "",
      Monto: Number(e.amount),
      Origen: "Movimiento manual",
    }));

    const ventas = (payments || []).map((p: any) => ({
      Fecha: p.paid_at?.slice(0, 10) || "",
      Tipo: "ingreso",
      Clasificación: "",
      Categoría: "venta",
      Descripción: `${p.order?.item_name || ""} - ${p.order?.customer?.full_name || ""} (${p.method})`,
      Monto: Number(p.amount),
      Origen: "Pago de pedido",
    }));

    const rows = [...gastosIngresos, ...ventas].sort((a, b) => (a.Fecha < b.Fecha ? 1 : -1));
    buildSheet(workbook, "Finanzas", rows);
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filenameFor(type)}"`,
    },
  });
}
