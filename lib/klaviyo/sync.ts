import { supabaseAdmin } from "../supabase/admin";
import { metricByName } from "./metrics";
import { klaviyo, klaviyoAll } from "./api";

// Copies one client's Klaviyo campaigns (email + SMS), campaign stats, flows and flow stats into
// Supabase. Read-only against Klaviyo. Each run is logged in klaviyo_sync_runs.

const CAMPAIGN_LOOKBACK_DAYS = 400; // a little over a year, so 365-day views are complete
// Klaviyo has no 60/120/180-day presets, so those are custom windows ending now. 120 and 180 exist so
// the dashboard can compare 60 and 90 days with the period before them (2N minus N).
const lastDays = (n: number) => () => ({ start: new Date(Date.now() - n * 864e5).toISOString().slice(0, 19), end: new Date().toISOString().slice(0, 19) });
const FLOW_TIMEFRAMES = [
  { timeframe: () => ({ key: "last_30_days" }), label: "30d" },
  { timeframe: lastDays(60), label: "60d" },
  { timeframe: () => ({ key: "last_90_days" }), label: "90d" },
  { timeframe: lastDays(120), label: "120d" },
  { timeframe: lastDays(180), label: "180d" },
  { timeframe: () => ({ key: "last_365_days" }), label: "365d" },
];
const STATS = ["recipients", "delivered", "opens_unique", "clicks_unique", "conversions", "conversion_value", "unsubscribes", "bounce_rate", "spam_complaints"];

type Counts = { recipients: number; delivered: number; opens_unique: number; clicks_unique: number; conversions: number; conversion_value: number; unsubscribes: number; bounces: number; spam_complaints: number };
const zero = (): Counts => ({ recipients: 0, delivered: 0, opens_unique: 0, clicks_unique: 0, conversions: 0, conversion_value: 0, unsubscribes: 0, bounces: 0, spam_complaints: 0 });
const add = (c: Counts, s: Record<string, number>) => {
  c.recipients += s.recipients ?? 0;
  c.delivered += s.delivered ?? 0;
  c.opens_unique += s.opens_unique ?? 0;
  c.clicks_unique += s.clicks_unique ?? 0;
  c.conversions += s.conversions ?? 0;
  c.conversion_value += s.conversion_value ?? 0;
  c.unsubscribes += s.unsubscribes ?? 0;
  c.bounces += Math.round((s.bounce_rate ?? 0) * (s.recipients ?? 0));
  c.spam_complaints += s.spam_complaints ?? 0;
};

async function placedOrderMetric(key: string): Promise<string> {
  const metric = await metricByName(key, "Placed Order");
  if (!metric) throw new Error("No 'Placed Order' metric in this Klaviyo account, so revenue can't be attributed");
  return metric.id;
}

async function fetchCampaigns(key: string, channel: "email" | "sms") {
  const cutoff = Date.now() - CAMPAIGN_LOOKBACK_DAYS * 864e5;
  const when = (c: any) => Date.parse(c.attributes.send_time ?? c.attributes.scheduled_at ?? c.attributes.created_at);
  // Newest first; stop paging once a whole page is older than the look-back window.
  const dated = await klaviyoAll<any>(key, `/campaigns/?filter=equals(messages.channel,'${channel}')&sort=-scheduled_at&include=campaign-messages`, (page) =>
    page.length > 0 && page.every((c) => when(c) < cutoff),
  );
  // Drafts have no schedule date, so fetch them separately.
  const drafts = await klaviyoAll<any>(key, `/campaigns/?filter=and(equals(messages.channel,'${channel}'),equals(status,'Draft'))&include=campaign-messages`).catch(() => ({ data: [], included: [] }));
  const messages = new Map<string, any>([...dated.included, ...drafts.included].filter((x) => x.type === "campaign-message").map((m) => [m.id, m.attributes]));
  const seen = new Set<string>();
  return [...dated.data, ...drafts.data]
    .filter((c) => !seen.has(c.id) && seen.add(c.id) && (c.attributes.status === "Draft" || when(c) >= cutoff))
    .map((c) => {
      const msgId = c.relationships?.["campaign-messages"]?.data?.[0]?.id;
      const content = messages.get(msgId)?.definition?.content ?? messages.get(msgId)?.content ?? {};
      return {
        campaign_id: c.id,
        message_id: msgId ?? null,
        channel,
        name: c.attributes.name,
        status: c.attributes.status,
        archived: !!c.attributes.archived,
        send_time: c.attributes.send_time ?? null,
        scheduled_at: c.attributes.scheduled_at ?? null,
        created_at_klaviyo: c.attributes.created_at ?? null,
        subject: content.subject ?? null,
        preview_text: content.preview_text ?? null,
        from_label: content.from_label ?? null,
        sms_body: content.body ?? null,
        audiences: c.attributes.audiences ?? {},
      };
    });
}

async function report(key: string, kind: "campaign" | "flow", timeframe: Record<string, string>, metricId: string): Promise<any[]> {
  const body = { data: { type: `${kind}-values-report`, attributes: { statistics: STATS, timeframe, conversion_metric_id: metricId } } };
  const res = await klaviyo<any>(key, `/${kind}-values-reports/`, { method: "POST", body });
  return res.data.attributes.results;
}

async function upsert(table: string, rows: Record<string, unknown>[]) {
  const db = supabaseAdmin();
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + 500));
    if (error) throw new Error(`saving ${table}: ${error.message}`);
  }
}

// Daily store revenue (all orders) for the last year, bucketed in the client's timezone.
async function storeRevenueDaily(key: string, metricId: string, timezone: string) {
  const end = new Date();
  const start = new Date(end.getTime() - 364 * 864e5); // Klaviyo allows at most one year
  const res = await klaviyo<any>(key, "/metric-aggregates/", {
    method: "POST",
    body: {
      data: {
        type: "metric-aggregate",
        attributes: {
          metric_id: metricId,
          measurements: ["sum_value", "count"],
          interval: "day",
          page_size: 500,
          timezone,
          filter: [`greater-or-equal(datetime,${start.toISOString().slice(0, 19)})`, `less-than(datetime,${end.toISOString().slice(0, 19)})`],
        },
      },
    },
  });
  const a = res.data.attributes;
  const m = a.data?.[0]?.measurements ?? { sum_value: [], count: [] };
  return (a.dates as string[]).map((d, i) => ({
    day: new Date(d).toLocaleDateString("en-CA", { timeZone: timezone }),
    revenue: m.sum_value[i] ?? 0,
    orders: m.count[i] ?? 0,
  }));
}

// Daily attributed revenue for the last year, by flow ('' = campaigns) and channel.
async function attributedRevenueDaily(key: string, metricId: string, timezone: string) {
  const end = new Date();
  const start = new Date(end.getTime() - 364 * 864e5);
  const rows: { day: string; flow_id: string; channel: string; revenue: number; orders: number }[] = [];
  const body = {
    data: {
      type: "metric-aggregate",
      attributes: {
        metric_id: metricId,
        measurements: ["sum_value", "count"],
        interval: "day",
        page_size: 500,
        by: ["$attributed_flow", "$attributed_channel"],
        timezone,
        filter: [`greater-or-equal(datetime,${start.toISOString().slice(0, 19)})`, `less-than(datetime,${end.toISOString().slice(0, 19)})`],
      },
    },
  };
  const channelOf: Record<string, string> = { $email_channel: "email", $sms_channel: "sms", $push_channel: "push" };
  const res = await klaviyo<any>(key, "/metric-aggregates/", { method: "POST", body });
  const a = res.data.attributes;
  const days = (a.dates as string[]).map((d) => new Date(d).toLocaleDateString("en-CA", { timeZone: timezone }));
  for (const g of a.data as any[]) {
    const [flow, ch] = g.dimensions as [string, string];
    const channel = channelOf[ch];
    if (!channel) continue; // not attributed to email/SMS
    g.measurements.sum_value.forEach((v: number, i: number) => {
      const orders = g.measurements.count[i] ?? 0;
      if (v || orders) rows.push({ day: days[i], flow_id: flow ?? "", channel, revenue: v ?? 0, orders });
    });
  }
  return rows;
}

// Plain text of an email's HTML (image alt text included), plus a rough shape of the layout.
export function emailText(html: string) {
  const images = (html.match(/<img\b/gi) ?? []).length;
  const links = (html.match(/<a\b[^>]*href=/gi) ?? []).length;
  // Designed emails carry most of their copy in images, and Fluid writes that copy into the alt text,
  // so each image becomes a line of the email, in order.
  const text = html
    .replace(/<(head|style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<img\b[^>]*?\balt="([^"]+)"[^>]*>/gi, "\n[image] $1\n")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/h\d|\/li|\/tr|\/td)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"').replace(/&mdash;/g, "—").replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/g, " ")
    .split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean)
    // Footers repeat on every send and say nothing about the message.
    .filter((l) => !/unsubscribe|manage (your )?preferences|no longer want|view in browser|all rights reserved/i.test(l))
    .join("\n");
  return { text, meta: { words: text.split(/\s+/).filter(Boolean).length, images, links } };
}

// The content of sent email campaigns from the last ~4 months, fetched once each (sent emails don't change).
export async function syncCampaignBodies(key: string, clientId: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("klaviyo_campaigns")
    .select("campaign_id, message_id")
    .eq("client_id", clientId)
    .eq("channel", "email")
    .eq("status", "Sent")
    .is("body_synced_at", null)
    .not("message_id", "is", null)
    .gte("send_time", new Date(Date.now() - 130 * 864e5).toISOString());
  let n = 0;
  for (const c of data ?? []) {
    const t = await klaviyo<any>(key, `/campaign-messages/${c.message_id}/template/`).catch(() => null);
    const html = t?.data?.attributes?.html ?? "";
    const { text, meta } = emailText(html);
    await db.from("klaviyo_campaigns").update({ body_text: text.slice(0, 8000) || null, body_meta: { ...meta, editor: t?.data?.attributes?.editor_type ?? null }, body_synced_at: new Date().toISOString() }).eq("client_id", clientId).eq("campaign_id", c.campaign_id);
    n++;
  }
  return n;
}

export type SyncResult = { ok: true; counts: Record<string, number> } | { ok: false; error: string };

export async function syncKlaviyo(clientId: string, startedBy?: string): Promise<SyncResult> {
  const db = supabaseAdmin();
  const { data: run } = await db.from("klaviyo_sync_runs").insert({ client_id: clientId, started_by: startedBy ?? null }).select("id").single();
  const finish = (patch: Record<string, unknown>) => db.from("klaviyo_sync_runs").update({ finished_at: new Date().toISOString(), ...patch }).eq("id", run!.id);
  try {
    const { data: key, error } = await db.rpc("get_connection_secret", { p_client: clientId, p_provider: "klaviyo" });
    if (error || !key) throw new Error("This client hasn't connected Klaviyo");
    const now = new Date().toISOString();
    const metricId = await placedOrderMetric(key);

    // Campaigns + their lifetime stats
    const campaigns = [...(await fetchCampaigns(key, "email")), ...(await fetchCampaigns(key, "sms"))];
    await upsert("klaviyo_campaigns", campaigns.map((c) => ({ ...c, client_id: clientId, synced_at: now })));
    const byCampaign = new Map<string, Counts>();
    for (const r of await report(key, "campaign", { key: "last_365_days" }, metricId)) {
      const id = r.groupings.campaign_id;
      if (!campaigns.some((c) => c.campaign_id === id)) continue;
      add(byCampaign.get(id) ?? byCampaign.set(id, zero()).get(id)!, r.statistics);
    }
    await upsert("klaviyo_campaign_stats", [...byCampaign].map(([campaign_id, c]) => ({ client_id: clientId, campaign_id, ...c, synced_at: now })));
    const bodies = await syncCampaignBodies(key, clientId);

    // Flows + per-channel stats for each window
    const flows = (await klaviyoAll<any>(key, "/flows/")).data.map((f) => ({
      client_id: clientId,
      flow_id: f.id,
      name: f.attributes.name,
      status: f.attributes.status,
      archived: !!f.attributes.archived,
      trigger_type: f.attributes.trigger_type ?? null,
      created_at_klaviyo: f.attributes.created ?? null,
      updated_at_klaviyo: f.attributes.updated ?? null,
      synced_at: now,
    }));
    await upsert("klaviyo_flows", flows);
    const flowIds = new Set(flows.map((f) => f.flow_id));
    const flowRows: Record<string, unknown>[] = [];
    for (const tf of FLOW_TIMEFRAMES) {
      const agg = new Map<string, Counts>();
      for (const r of await report(key, "flow", tf.timeframe(), metricId)) {
        if (!flowIds.has(r.groupings.flow_id)) continue;
        const k = `${r.groupings.flow_id}|${r.groupings.send_channel}`;
        add(agg.get(k) ?? agg.set(k, zero()).get(k)!, r.statistics);
      }
      for (const [k, c] of agg) {
        const [flow_id, channel] = k.split("|");
        const { bounces: _b, ...rest } = c;
        flowRows.push({ client_id: clientId, flow_id, channel, timeframe: tf.label, ...rest, synced_at: now });
      }
    }
    // Replace flow stats wholesale so flows that stopped sending don't keep stale numbers.
    await db.from("klaviyo_flow_stats").delete().eq("client_id", clientId);
    await upsert("klaviyo_flow_stats", flowRows);

    // Store revenue (all orders), in the client's timezone
    const { data: tzAnswer } = await db.from("profile_answers").select("answer").eq("client_id", clientId).eq("question_id", "timezone").maybeSingle();
    const { clientTimeZone } = await import("../onboarding/timezone");
    const days = await storeRevenueDaily(key, metricId, clientTimeZone(tzAnswer?.answer as string | undefined));
    await upsert("klaviyo_store_revenue_daily", days.map((d) => ({ client_id: clientId, ...d, synced_at: now })));
    const attributed = await attributedRevenueDaily(key, metricId, clientTimeZone(tzAnswer?.answer as string | undefined));
    await db.from("klaviyo_attributed_revenue_daily").delete().eq("client_id", clientId);
    await upsert("klaviyo_attributed_revenue_daily", attributed.map((r) => ({ client_id: clientId, ...r, synced_at: now })));

    const counts = {
      store_revenue_days: days.length,
      attributed_revenue_rows: attributed.length,
      email_campaigns: campaigns.filter((c) => c.channel === "email").length,
      sms_campaigns: campaigns.filter((c) => c.channel === "sms").length,
      campaigns_with_stats: byCampaign.size,
      email_bodies_fetched: bodies,
      flows: flows.length,
      flow_stat_rows: flowRows.length,
    };
    await finish({ status: "ok", counts });
    return { ok: true, counts };
  } catch (e) {
    const error = (e as Error).message;
    await finish({ status: "failed", error });
    return { ok: false, error };
  }
}
