import { createServerSupabase } from "@/lib/supabase/server";
import { formatUSD, formatDate } from "@/lib/utils";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, type CustomerChannel, type Order } from "@/types/database";
import { CHANNEL_COLOR, STATUS_COLOR, CATEGORICAL_PALETTE } from "@/lib/chartColors";
import Link from "next/link";
import DonutChart from "@/components/admin/charts/DonutChart";
import BarChart from "@/components/admin/charts/BarChart";
import PipelineChart from "@/components/admin/charts/PipelineChart";
import HorizontalBarChart from "@/components/admin/charts/HorizontalBarChart";

export const dynamic = "force-dynamic";

const CHANNEL_LABEL: Record<CustomerChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  tienda: "Tienda",
  referido: "Referido",
  otro: "Otro",
};

async function getStats() {
  const supabase = await createServerSupabase();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    { data: balances },
    { data: monthPayments },
    { data: pending },
    { count: shippedCount },
    { count: activeOrdersCount },
    { count: customerCount },
    { data: allOrders },
    { data: customers },
    { data: revenuePayments },
    { data: sellers },
    { data: sellerOrders },
  ] = await Promise.all([
    supabase.from("customer_balances").select("*").order("total_balance_due", { ascending: false }).limit(6),
    supabase.from("payments").select("amount").gte("paid_at", startOfMonth.toISOString()),
    supabase
      .from("orders")
      .select("id, item_name, status, created_at, customer:customers(full_name)")
      .eq("status", "pendiente")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "enviado"),
    supabase.from("orders").select("id", { count: "exact", head: true }).not("status", "in", '("entregado","cancelado")'),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("status"),
    supabase.from("customers").select("channel"),
    supabase.from("payments").select("amount, paid_at").gte("paid_at", sixMonthsAgo.toISOString()),
    supabase.from("sellers").select("id, full_name").eq("active", true).order("full_name"),
    supabase
      .from("orders")
      .select("seller_id, price_usd")
      .not("seller_id", "is", null)
      .neq("status", "cancelado")
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  const monthlyRevenue = (monthPayments || []).reduce((sum, p: any) => sum + Number(p.amount), 0);
  const totalReceivable = (balances || []).reduce((sum, b: any) => sum + Number(b.total_balance_due), 0);

  const pipelineStages = ORDER_STATUS_FLOW.map((status) => ({
    label: ORDER_STATUS_LABEL[status],
    value: (allOrders || []).filter((o: any) => o.status === status).length,
    color: STATUS_COLOR[status],
  }));

  const channelCounts = new Map<string, number>();
  for (const c of customers || []) {
    channelCounts.set(c.channel, (channelCounts.get(c.channel) || 0) + 1);
  }
  const channelData = Array.from(channelCounts.entries()).map(([channel, value]) => ({
    label: CHANNEL_LABEL[channel as CustomerChannel] || channel,
    value,
    color: CHANNEL_COLOR[channel as CustomerChannel] || "#9CA3AF",
  }));

  const monthLabels: string[] = [];
  const monthKeys: string[] = [];
  const cursor = new Date(sixMonthsAgo);
  for (let i = 0; i < 6; i++) {
    monthKeys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    monthLabels.push(cursor.toLocaleDateString("es-EC", { month: "short" }).replace(".", ""));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const revenueByMonth = monthKeys.map((key) =>
    (revenuePayments || [])
      .filter((p: any) => p.paid_at.slice(0, 7) === key)
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0)
  );

  const salesBySeller = new Map<string, number>();
  for (const o of sellerOrders || []) {
    const key = o.seller_id as string;
    salesBySeller.set(key, (salesBySeller.get(key) || 0) + Number(o.price_usd));
  }
  const sellerBars = (sellers || []).map((s: any, i: number) => ({
    label: s.full_name,
    value: salesBySeller.get(s.id) || 0,
    color: CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length],
  }));

  return {
    balances: balances || [],
    monthlyRevenue,
    totalReceivable,
    pending: pending || [],
    shippedCount: shippedCount ?? 0,
    activeOrdersCount: activeOrdersCount ?? 0,
    customerCount: customerCount ?? 0,
    pipelineStages,
    channelData,
    monthLabels,
    revenueByMonth,
    sellerBars,
  };
}

export default async function AdminHome() {
  const stats = await getStats();

  const cards = [
    { label: "Cuentas por cobrar", value: formatUSD(stats.totalReceivable), tone: "text-brand-400" },
    { label: "Ingresos este mes", value: formatUSD(stats.monthlyRevenue), tone: "text-emerald-400" },
    { label: "Pedidos activos", value: stats.activeOrdersCount, tone: "text-white" },
    { label: "Clientes", value: stats.customerCount, tone: "text-white" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Resumen</h1>
        <p className="text-sm text-white/50">Estado general del negocio, hoy {formatDate(new Date().toISOString())}.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-xs uppercase tracking-wide text-white/40">{c.label}</p>
            <p className={`mt-2 text-2xl font-bold ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Pipeline de pedidos</h2>
          <PipelineChart stages={stats.pipelineStages} />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Ingresos últimos 6 meses</h2>
          <BarChart
            categories={stats.monthLabels}
            series={[{ label: "Ingresos", color: "#7259B8", values: stats.revenueByMonth }]}
            formatValue={(v) => formatUSD(v)}
          />
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Ventas por vendedor (este mes)</h2>
          <Link href="/admin/vendedores" className="text-sm text-brand-400 hover:underline">
            Ver detalle →
          </Link>
        </div>
        <div className="mt-4">
          {stats.sellerBars.length === 0 ? (
            <p className="text-sm text-white/40">Aún no has registrado vendedores.</p>
          ) : (
            <HorizontalBarChart bars={stats.sellerBars} formatValue={(v) => formatUSD(v)} />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Clientes por canal</h2>
          <DonutChart data={stats.channelData} title="clientes" />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Clientes con mayor saldo pendiente</h2>
          <div className="space-y-3">
            {stats.balances.filter((b: any) => Number(b.total_balance_due) > 0).length === 0 && (
              <p className="text-sm text-white/40">Sin saldos pendientes 🎉</p>
            )}
            {stats.balances
              .filter((b: any) => Number(b.total_balance_due) > 0)
              .map((b: any) => (
                <Link
                  key={b.customer_id}
                  href={`/admin/clientes/${b.customer_id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5"
                >
                  <span className="text-sm">{b.full_name}</span>
                  <span className="text-sm font-semibold text-brand-400">{formatUSD(b.total_balance_due)}</span>
                </Link>
              ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Pedidos pendientes de confirmar</h2>
          <div className="space-y-3">
            {stats.pending.length === 0 && <p className="text-sm text-white/40">No hay pedidos pendientes.</p>}
            {stats.pending.map((o: any) => (
              <Link
                key={o.id}
                href={`/admin/pedidos/${o.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5"
              >
                <div>
                  <p className="text-sm">{o.item_name}</p>
                  <p className="text-xs text-white/40">{o.customer?.full_name}</p>
                </div>
                <span className="badge bg-white/10 text-white/70">{ORDER_STATUS_LABEL[o.status as Order["status"]]}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Pedidos enviados</h2>
          <Link href="/admin/pedidos?status=enviado" className="text-sm text-brand-400 hover:underline">
            Ver todos →
          </Link>
        </div>
        <p className="mt-2 text-3xl font-bold">{stats.shippedCount}</p>
        <p className="text-sm text-white/40">pedidos en camino al cliente ahora mismo</p>
      </div>
    </div>
  );
}
