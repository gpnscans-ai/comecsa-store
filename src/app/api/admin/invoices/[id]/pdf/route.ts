import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createServerSupabase } from "@/lib/supabase/server";
import { INVOICE_DOC_TYPE_LABEL, type Invoice } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [{ data: invoice }, { data: settings }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).single<Invoice>(),
    supabase.from("business_settings").select("*").eq("id", 1).single(),
  ]);

  if (!invoice) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });

  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;

  const money = (n: number) => `$${n.toFixed(2)}`;
  const draw = (text: string, x: number, yPos: number, opts: { size?: number; f?: typeof font; color?: ReturnType<typeof rgb> } = {}) => {
    page.drawText(text, {
      x,
      y: yPos,
      size: opts.size ?? 10,
      font: opts.f ?? font,
      color: opts.color ?? rgb(0.1, 0.1, 0.1),
    });
  };

  // Encabezado
  draw(settings?.business_name || "COMECSA", margin, y, { size: 18, f: bold, color: rgb(0.176, 0.106, 0.412) });
  y -= 20;
  draw(`RUC: ${settings?.ruc || ""}`, margin, y, { size: 9 });
  y -= 13;
  draw(`Régimen: ${settings?.regimen || "RIMPE"}`, margin, y, { size: 9 });
  if (settings?.address) {
    y -= 13;
    draw(settings.address, margin, y, { size: 9 });
  }
  if (settings?.phone || settings?.email) {
    y -= 13;
    draw([settings?.phone, settings?.email].filter(Boolean).join(" · "), margin, y, { size: 9 });
  }

  // Caja del documento (esquina superior derecha)
  const boxW = 210;
  const boxX = width - margin - boxW;
  let boxY = height - margin;
  page.drawRectangle({ x: boxX, y: boxY - 60, width: boxW, height: 60, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
  draw(INVOICE_DOC_TYPE_LABEL[invoice.doc_type].toUpperCase(), boxX + 10, boxY - 18, { size: 11, f: bold });
  draw(`N° ${invoice.invoice_number}`, boxX + 10, boxY - 34, { size: 10 });
  draw(`Fecha: ${new Date(invoice.issued_at).toLocaleDateString("es-EC")}`, boxX + 10, boxY - 48, { size: 9 });

  y -= 40;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 20;

  // Datos del cliente
  draw("Cliente:", margin, y, { size: 9, f: bold, color: rgb(0.5, 0.5, 0.5) });
  y -= 14;
  draw(invoice.customer_name, margin, y, { size: 11, f: bold });
  y -= 14;
  if (invoice.customer_id_number) {
    draw(`CI/RUC: ${invoice.customer_id_number}`, margin, y, { size: 9 });
    y -= 13;
  }
  if (invoice.customer_address) {
    draw(invoice.customer_address, margin, y, { size: 9 });
    y -= 13;
  }

  y -= 15;

  // Tabla de items
  const colDesc = margin;
  const colQty = width - margin - 220;
  const colUnit = width - margin - 150;
  const colSubtotal = width - margin - 70;

  page.drawRectangle({ x: margin, y: y - 4, width: width - margin * 2, height: 20, color: rgb(0.95, 0.95, 0.97) });
  draw("Descripción", colDesc + 5, y + 2, { size: 9, f: bold });
  draw("Cant.", colQty, y + 2, { size: 9, f: bold });
  draw("P. Unit.", colUnit, y + 2, { size: 9, f: bold });
  draw("Subtotal", colSubtotal, y + 2, { size: 9, f: bold });
  y -= 24;

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  for (const item of items) {
    if (y < 160) break; // límite simple de una página
    draw(String(item.description).slice(0, 60), colDesc + 5, y, { size: 9 });
    draw(String(item.quantity), colQty, y, { size: 9 });
    draw(money(Number(item.unit_price)), colUnit, y, { size: 9 });
    draw(money(Number(item.subtotal)), colSubtotal, y, { size: 9 });
    y -= 18;
    page.drawLine({
      start: { x: margin, y: y + 8 },
      end: { x: width - margin, y: y + 8 },
      thickness: 0.5,
      color: rgb(0.92, 0.92, 0.92),
    });
  }

  y -= 15;

  // Totales
  const totalsX = width - margin - 180;
  draw("Subtotal", totalsX, y, { size: 10 });
  draw(money(Number(invoice.subtotal)), colSubtotal, y, { size: 10 });
  y -= 16;
  draw(`IVA (${Number(invoice.iva_pct)}%)`, totalsX, y, { size: 10 });
  draw(money(Number(invoice.iva_amount)), colSubtotal, y, { size: 10 });
  y -= 18;
  page.drawLine({ start: { x: totalsX, y: y + 12 }, end: { x: width - margin, y: y + 12 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
  draw("TOTAL", totalsX, y, { size: 12, f: bold });
  draw(money(Number(invoice.total)), colSubtotal, y, { size: 12, f: bold, color: rgb(0.176, 0.106, 0.412) });

  if (invoice.notes) {
    y -= 30;
    draw("Notas:", margin, y, { size: 9, f: bold });
    y -= 13;
    draw(String(invoice.notes).slice(0, 100), margin, y, { size: 9 });
  }

  // Aviso legal al pie
  const footerY = 60;
  page.drawLine({ start: { x: margin, y: footerY + 20 }, end: { x: width - margin, y: footerY + 20 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
  draw(
    "Documento de uso interno. No constituye comprobante electrónico autorizado por el SRI hasta contar con firma electrónica y autorización vigente.",
    margin,
    footerY,
    { size: 7, color: rgb(0.55, 0.55, 0.55) }
  );

  const pdfBytes = await doc.save();

  return new NextResponse(pdfBytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
