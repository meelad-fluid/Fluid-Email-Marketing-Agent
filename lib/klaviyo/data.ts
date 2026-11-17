import { supabaseAdmin } from "../supabase/admin";

// Reads the synced Klaviyo data for the internal view. Server-only; callers are staff pages.

// The report window: the last 30, 60 or 90 days (today included), or any custom dates. Dates are
// YYYY-MM-DD in the client's timezone, both ends inclusive.
export const PRESETS = [30, 60, 90] as const;
export type Range = { preset: (typeof PRESETS)[number] | null; from: string; to: string; days: number; label: string };

const isoDay = (d: Date, tz: string) => d.toLocaleDateString("en-CA", { timeZone: tz });
const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const fmt = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function parseRange(sp: { days?: string; from?: string; to?: string }, tz: string): Range {
  const today = isoDay(new Date(), tz);
  const valid = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
  if (valid(sp.from) && valid(sp.to)) {
    let [from, to] = [sp.from!, sp.to!].sort();
    if (to > today) to = today;
    if (from > to) from = to;
    const days = Math.round((Date.parse(to) - Date.parse(from)) / 864e5) + 1;
    return { preset: null, from, to, days, label: `${fmt(from)} – ${fmt(to)}` };
  }
  const n = PRESETS.find((p) => String(p) === sp.days) ?? 30;
  return { preset: n, from: addDays(today, -(n - 1)), to: today, days: n, label: `last ${n} days` };
}

/** The same number of days immediately before a window, for comparisons. */
export function previousRange(r: Range): Range {
  const to = addDays(r.from, -1), from = addDays(r.from, -r.days);
  return { preset: r.preset, from, to, days: r.days, label: `previous ${r.days} days` };
}

/** The window as URL params, for links that keep it. */
export const rangeQuery = (r: Range): Record<string, string> => (r.preset ? { days: String(r.preset) } : { from: r.from, to: r.to });
// Bounds as instants; a day either side would double-count, so this uses UTC midnights (close enough for US clients).
const startOf = (r: Range) => `${r.from}T00:00:00Z`;
const endOf = (r: Range) => `${addDays(r.to, 1)}T00:00:00Z`;

export type Campaign = {
  campaign_id: string;
  channel: "email" | "sms";
  name: string;
  status: string;
  send_time: string | null;
  scheduled_at: string | null;
  subject: string | null;
  preview_text: string | null;
  from_label: string | null;
  sms_body: string | null;
  stats: Stats | null;
};

export type Stats = {
  recipients: number;
  delivered: number;
  opens_unique: number;
  clicks_unique: number;
  conversions: number;
  conversion_value: number;
  unsubscribes: number;
  bounces?: number;
  spam_complaints: number;
};

// Rates use delivered as the base, matching how Klaviyo reports them.
export const rates = (s: Stats) => {
  const d = s.delivered || 0;
  return {
    openRate: d ? s.opens_unique / d : null,
    clickRate: d ? s.clicks_unique / d : null,
    orderRate: d ? s.conversions / d : null,
    rpr: d ? s.conversion_value / d : null,
    unsubRate: d ? s.unsubscribes / d : null,
  };
};

export function sumStats(list: (Stats | null)[]): Stats {
  const t: Stats = { recipients: 0, delivered: 0, opens_unique: 0, clicks_unique: 0, conversions: 0, conversion_value: 0, unsubscribes: 0, bounces: 0, spam_complaints: 0 };
  for (const s of list) {
    if (!s) continue;
    t.recipients += s.recipients;
    t.delivered += s.delivered;
    t.opens_unique += s.opens_unique;
    t.clicks_unique += s.clicks_unique;
    t.conversions += s.conversions;
    t.conversion_value += Number(s.conversion_value);
    t.unsubscribes += s.unsubscribes;
    t.bounces! += s.bounces ?? 0;
    t.spam_complaints += s.spam_complaints;
  }
  return t;
}

const CAMPAIGN_COLS =
  "campaign_id, channel, name, status, send_time, scheduled_at, subject, preview_text, from_label, sms_body, klaviyo_campaign_stats(recipients, delivered, opens_unique, clicks_unique, conversions, conversion_value, unsubscribes, bounces, spam_complaints)";

function toCampaign(r: any): Campaign {
  const s = Array.isArray(r.klaviyo_campaign_stats) ? r.klaviyo_campaign_stats[0] : r.klaviyo_campaign_stats;
  const { klaviyo_campaign_stats: _s, ...c } = r;
  return { ...c, stats: s ? { ...s, conversion_value: Number(s.conversion_value) } : null };
}

/** Sent campaigns for a channel within the window, newest first. */
export async function sentCampaigns(clientId: string, channel: "email" | "sms", range: Range): Promise<Campaign[]> {
  const { data, error } = await supabaseAdmin()
    .from("klaviyo_campaigns")
    .select(CAMPAIGN_COLS)
    .eq("client_id", clientId)
    .eq("channel", channel)
    .eq("status", "Sent")
    .gte("send_time", startOf(range))
    .lt("send_time", endOf(range))
    .order("send_time", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toCampaign);
}

/** Every campaign (both channels) whose send or schedule date falls in [from, to). */
export async function campaignsBetween(clientId: string, from: Date, to: Date): Promise<Campaign[]> {
  const { data, error } = await supabaseAdmin()
    .from("klaviyo_campaigns")
    .select(CAMPAIGN_COLS)
    .eq("client_id", clientId)
    .or(`and(send_time.gte.${from.toISOString()},send_time.lt.${to.toISOString()}),and(send_time.is.null,scheduled_at.gte.${from.toISOString()},scheduled_at.lt.${to.toISOString()})`)
    .order("send_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toCampaign);
}

export async function draftCampaigns(clientId: string): Promise<Campaign[]> {
  const { data, error } = await supabaseAdmin()
    .from("klaviyo_campaigns")
    .select(CAMPAIGN_COLS)
    .eq("client_id", clientId)
    .eq("status", "Draft")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(toCampaign);
}

export type FlowRow = { flow_id: string; name: string; status: string; trigger_type: string | null; email: Stats | null; sms: Stats | null };

/**
 * Flows with their results in the window. The presets use Klaviyo's flow reports (recipients, opens,
 * clicks, revenue). A custom window only has revenue and orders, from the daily attributed revenue,
 * so recipients and rates are null there (`revenueOnly`).
 */
export async function flowsWithStats(clientId: string, range: Range): Promise<FlowRow[] & { revenueOnly?: boolean }> {
  const db = supabaseAdmin();
  const flowsQuery = db.from("klaviyo_flows").select("flow_id, name, status, trigger_type, archived").eq("client_id", clientId).eq("archived", false);
  let pick: (id: string, ch: string) => Stats | null;
  if (range.preset) {
    const [{ data: flows, error: e1 }, { data: stats, error: e2 }] = await Promise.all([flowsQuery, db.from("klaviyo_flow_stats").select("*").eq("client_id", clientId).eq("timeframe", `${range.preset}d`)]);
    if (e1 || e2) throw new Error((e1 ?? e2)!.message);
    pick = (id, ch) => {
      const s = (stats ?? []).find((x) => x.flow_id === id && x.channel === ch);
      return s ? ({ ...s, conversion_value: Number(s.conversion_value) } as Stats) : null;
    };
    return (flows ?? []).map((f) => ({ flow_id: f.flow_id, name: f.name, status: f.status, trigger_type: f.trigger_type, email: pick(f.flow_id, "email"), sms: pick(f.flow_id, "sms") }));
  }
  const [{ data: flows, error: e1 }, daily] = await Promise.all([flowsQuery, attributedDaily(clientId, range)]);
  if (e1) throw new Error(e1.message);
  const sums = new Map<string, { revenue: number; orders: number }>();
  for (const d of daily.filter((d) => d.flow_id)) {
    const k = `${d.flow_id}|${d.channel}`;
    const s = sums.get(k) ?? sums.set(k, { revenue: 0, orders: 0 }).get(k)!;
    s.revenue += d.revenue;
    s.orders += d.orders;
  }
  pick = (id, ch) => {
    const s = sums.get(`${id}|${ch}`);
    return s ? { recipients: NaN, delivered: NaN, opens_unique: NaN, clicks_unique: NaN, conversions: s.orders, conversion_value: s.revenue, unsubscribes: NaN, spam_complaints: NaN } : null;
  };
  const rows: FlowRow[] & { revenueOnly?: boolean } = (flows ?? []).map((f) => ({ flow_id: f.flow_id, name: f.name, status: f.status, trigger_type: f.trigger_type, email: pick(f.flow_id, "email"), sms: pick(f.flow_id, "sms") }));
  rows.revenueOnly = true;
  return rows;
}

/**
 * Email flow totals for a preset window, or for the period before it: Klaviyo's flow reports all end
 * now, so the previous N days are the last 2N days minus the last N.
 */
export async function emailFlowTotals(clientId: string, preset: number, previous = false): Promise<Stats> {
  const tfs = previous ? [`${preset}d`, `${preset * 2}d`] : [`${preset}d`];
  const { data, error } = await supabaseAdmin().from("klaviyo_flow_stats").select("*").eq("client_id", clientId).eq("channel", "email").in("timeframe", tfs);
  if (error) throw new Error(error.message);
  const total = (tf: string) => sumStats((data ?? []).filter((s) => s.timeframe === tf).map((s) => ({ ...s, conversion_value: Number(s.conversion_value) }) as Stats));
  if (!previous) return total(`${preset}d`);
  const [n, both] = [total(`${preset}d`), total(`${preset * 2}d`)];
  if (!both.delivered) return { ...both, delivered: NaN }; // not synced yet
  const out = { ...both };
  for (const k of Object.keys(out) as (keyof Stats)[]) (out as any)[k] = (both[k] ?? 0) - (n[k] ?? 0);
  return out;
}

/** Daily attributed revenue in the window, by flow ('' = campaigns) and channel. */
export async function attributedDaily(clientId: string, range: Range) {
  // Paged: the API returns at most 1,000 rows at a time, and 90 days across every flow is more.
  const rows: { day: string; flow_id: string; channel: string; revenue: number; orders: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin()
      .from("klaviyo_attributed_revenue_daily")
      .select("day, flow_id, channel, revenue, orders")
      .eq("client_id", clientId)
      .gte("day", range.from)
      .lte("day", range.to)
      .order("day")
      .order("flow_id")
      .order("channel")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []).map((d) => ({ ...d, revenue: Number(d.revenue), orders: Number(d.orders) })));
    if ((data ?? []).length < 1000) return rows;
  }
}

/** Store revenue (all orders) in the window. */
export async function storeRevenue(clientId: string, range: Range) {
  const { data, error } = await supabaseAdmin().from("klaviyo_store_revenue_daily").select("revenue, orders").eq("client_id", clientId).gte("day", range.from).lte("day", range.to);
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((t, d) => ({ revenue: t.revenue + Number(d.revenue), orders: t.orders + Number(d.orders) }), { revenue: 0, orders: 0 });
}

export type SyncRun = { status: "running" | "ok" | "failed"; started_at: string; finished_at: string | null; error: string | null; counts: Record<string, number> };

export async function lastSync(clientId: string): Promise<SyncRun | null> {
  const { data } = await supabaseAdmin()
    .from("klaviyo_sync_runs")
    .select("status, started_at, finished_at, error, counts")
    .eq("client_id", clientId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as SyncRun) ?? null;
}

/** Campaigns scheduled to send from now on (both channels), soonest first. */
export async function upcomingCampaigns(clientId: string, limit = 10): Promise<Campaign[]> {
  const { data, error } = await supabaseAdmin()
    .from("klaviyo_campaigns")
    .select(CAMPAIGN_COLS)
    .eq("client_id", clientId)
    .in("status", ["Scheduled", "Sending", "Queued without Recipients"])
    .gte("send_time", new Date().toISOString())
    .order("send_time", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toCampaign);
}
