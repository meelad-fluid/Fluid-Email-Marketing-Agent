// Customer.io reporting, live from the App API (nothing stored), the same approach as Fluid's peptide
// revenue dashboard: one-time sends ("newsletters") = campaigns, automations ("campaigns") = flows,
// and revenue = the store's order events in Customer.io attributed to the last email the person opened
// or clicked in the 5 days before the order (Klaviyo's default window, so numbers compare across clients).
// Order events are only guaranteed for the last 30 days, so revenue is reported for at most 30 days back.
import { cioRead, type CioCreds } from "./api";

const ORDER_NAME = /(order|purchase|checkout.?complete|payment|transaction|sale|paid)/i;
const NOT_ORDER = /(start|abandon|view|add|cart|refund|cancel|fail|declin|update|ship|fulfil|deliver|return|subscri)/i;
const VALUE_FIELDS = ["order_value", "order_total", "total", "total_price", "grand_total", "value", "revenue", "amount", "price", "subtotal", "order_subtotal"];
const WINDOW = 5 * 86400;
const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[$,]/g, "")); return Number.isFinite(n) ? n : NaN; };

async function pages(get: (q: Record<string, unknown>) => Promise<any>, key: string, q: Record<string, unknown>, max = 20, stop?: (rows: any[]) => boolean) {
  const out: any[] = []; let start: string | undefined;
  for (let i = 0; i < max; i++) {
    const d = await get({ ...q, ...(start ? { start } : {}) });
    const rows = d[key] ?? [];
    out.push(...rows);
    if (!d.next || !rows.length || stop?.(rows)) break;
    start = d.next;
  }
  return out;
}

/** Which event is the order, and which field holds its value (placed_order first, else the most common order-like event). */
export async function detectOrderEvent(c: CioCreds): Promise<{ name: string; field: string | null } | null> {
  const r = cioRead(c);
  const recent = await pages((q) => r.get("/v1/activities", q), "activities", { type: "event", limit: 100 }, 5);
  const counts = new Map<string, number>();
  for (const e of recent) counts.set(e.name, (counts.get(e.name) ?? 0) + 1);
  const names = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const name = names.find((n) => /^placed[_ ]?order$/i.test(n)) ?? names.find((n) => ORDER_NAME.test(n) && !NOT_ORDER.test(n));
  if (!name) return null;
  const ev = recent.filter((e) => e.name === name);
  const field = VALUE_FIELDS.find((f) => ev.some((e) => e.data && Number.isFinite(num(e.data[f])))) ?? null;
  return { name, field };
}

const sumSeries = (m: any) => {
  const series = m?.metric?.series ?? m?.series ?? {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(series)) out[k] = Array.isArray(v) ? (v as number[]).reduce((a, b) => a + (Number(b) || 0), 0) : Number(v) || 0;
  return out;
};

export type CioReport = {
  range: { start: string; end: string };
  revenue_window_note: string;
  order_event: string | null;
  totals: { email_revenue: number; orders: number; campaign_revenue: number; flow_revenue: number; sends: number };
  campaigns: { id: number; name: string; sent_at: string | null; sent: number; opened: number; clicked: number; converted: number; unsubscribed: number; revenue: number; orders: number }[];
  flows: { id: number; name: string; active: boolean; sent: number; opened: number; clicked: number; revenue: number; orders: number }[];
};

export async function cioReport(c: CioCreds, startDate: string, endDate: string): Promise<CioReport> {
  const r = cioRead(c);
  const start = Math.floor(Date.parse(`${startDate}T00:00:00Z`) / 1000), end = Math.floor(Date.parse(`${endDate}T23:59:59Z`) / 1000);
  const days = Math.max(2, Math.ceil((end - start) / 86400));

  // One-time sends sent in the range, with their metrics.
  const newsletters = (await r.get("/v1/newsletters", { limit: 100, sort: "desc" })).newsletters ?? [];
  const sent = newsletters.filter((n: any) => n.sent_at && n.sent_at >= start && n.sent_at <= end);
  const campaigns: CioReport["campaigns"] = [];
  for (const n of sent) {
    const m = sumSeries(await r.get(`/v1/newsletters/${n.id}/metrics`, { period: "days", steps: Math.min(days + 7, 120) }).catch(() => ({})));
    campaigns.push({ id: n.id, name: n.name, sent_at: new Date(n.sent_at * 1000).toISOString().slice(0, 10), sent: m.sent ?? 0, opened: m.human_opened ?? m.opened ?? 0, clicked: m.human_clicked ?? m.clicked ?? 0, converted: m.converted ?? 0, unsubscribed: m.unsubscribed ?? 0, revenue: 0, orders: 0 });
  }
  // Automations (flows) with metrics over the range.
  const autos = (await r.get("/v1/campaigns")).campaigns ?? [];
  const flows: CioReport["flows"] = [];
  for (const a of autos) {
    const m = sumSeries(await r.get(`/v1/campaigns/${a.id}/metrics`, { period: "days", steps: days }).catch(() => ({})));
    if (!(m.sent ?? 0) && !a.active) continue;
    flows.push({ id: a.id, name: a.name, active: !!a.active, sent: m.sent ?? 0, opened: m.human_opened ?? m.opened ?? 0, clicked: m.human_clicked ?? m.clicked ?? 0, revenue: 0, orders: 0 });
  }

  // Revenue: order events (last 30 days only) → last email opened/clicked by the same person within 5 days before.
  const orderEv = await detectOrderEvent(c).catch(() => null);
  const thirty = Math.floor(Date.now() / 1000) - 30 * 86400;
  const revStart = Math.max(start, thirty);
  let note = revStart > start ? `Revenue covers ${new Date(revStart * 1000).toISOString().slice(0, 10)} onward (Customer.io keeps order events for 30 days).` : "Revenue covers the full range.";
  if (orderEv && revStart < end) {
    const orders = (await pages((q) => r.get("/v1/activities", q), "activities", { type: "event", name: orderEv.name, limit: 100 }, 40, (rows) => rows.some((e: any) => e.timestamp < revStart)))
      .filter((e: any) => e.timestamp >= revStart && e.timestamp <= end);
    const touches: { cust: string; ts: number; newsletter_id?: number; campaign_id?: number }[] = [];
    for (const metric of ["clicked", "opened"]) {
      const msgs = await pages((q) => r.get("/v1/messages", q), "messages", { metric, type: "email", start_ts: revStart - WINDOW, end_ts: end, limit: 1000 }, 30);
      for (const m of msgs) {
        const ts = m.metrics?.[metric] ?? m.metrics?.[`human_${metric}`];
        if (ts && m.customer_id) touches.push({ cust: String(m.customer_id), ts, newsletter_id: m.newsletter_id ?? undefined, campaign_id: m.campaign_id ?? undefined });
      }
    }
    const byCust = new Map<string, typeof touches>();
    for (const t of touches) byCust.set(t.cust, [...(byCust.get(t.cust) ?? []), t]);
    for (const o of orders) {
      const value = orderEv.field ? num(o.data?.[orderEv.field]) : NaN;
      const last = (byCust.get(String(o.customer_id)) ?? []).filter((t) => t.ts <= o.timestamp && o.timestamp - t.ts <= WINDOW).sort((a, b) => b.ts - a.ts)[0];
      if (!last) continue;
      const v = Number.isFinite(value) ? value : 0;
      const row = last.newsletter_id ? campaigns.find((x) => x.id === last.newsletter_id) : flows.find((x) => x.id === last.campaign_id);
      if (row) { row.revenue += v; row.orders += 1; }
    }
  } else if (!orderEv) note = "No order event found in Customer.io (e.g. placed_order), so revenue can't be attributed. Ask the client to send order events to Customer.io.";

  const round = (n: number) => Math.round(n * 100) / 100;
  for (const x of [...campaigns, ...flows]) x.revenue = round(x.revenue);
  const campaign_revenue = round(campaigns.reduce((a, x) => a + x.revenue, 0)), flow_revenue = round(flows.reduce((a, x) => a + x.revenue, 0));
  return {
    range: { start: startDate, end: endDate }, revenue_window_note: note, order_event: orderEv?.name ?? null,
    totals: { email_revenue: round(campaign_revenue + flow_revenue), orders: [...campaigns, ...flows].reduce((a, x) => a + x.orders, 0), campaign_revenue, flow_revenue, sends: campaigns.length },
    campaigns: campaigns.sort((a, b) => b.revenue - a.revenue), flows: flows.sort((a, b) => b.revenue - a.revenue),
  };
}

/** Onboarding snapshot: senders, segments, automations, recent sends, order event. */
export async function cioAudit(c: CioCreds) {
  const r = cioRead(c);
  const safe = async <T,>(f: () => Promise<T>) => { try { return await f(); } catch (e: any) { return { error: e.message } as any; } };
  const end = new Date().toISOString().slice(0, 10), start = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  return {
    pulled_at: new Date().toISOString(), region: c.region,
    senders: await safe(async () => ((await r.get("/v1/sender_identities")).sender_identities ?? []).map((s: any) => ({ id: s.id, name: s.name, email: s.email }))),
    segments: await safe(async () => ((await r.get("/v1/segments")).segments ?? []).map((s: any) => ({ id: s.id, name: s.name, type: s.type, state: s.state }))),
    automations: await safe(async () => ((await r.get("/v1/campaigns")).campaigns ?? []).map((a: any) => ({ id: a.id, name: a.name, active: a.active, state: a.state, trigger: a.trigger_segment_ids ?? a.event_name ?? null }))),
    order_event: await safe(() => detectOrderEvent(c)),
    last_30_days: await safe(() => cioReport(c, start, end)),
  };
}
