// Read-only Klaviyo audit for onboarding (fluid-client-onboarding, references/klaviyo-audit.md):
// account basics, the top 10 flows (last 60 days) and campaigns from the last 60 days ranked by revenue per recipient.
// The key comes from the environment only and is never written anywhere.
// Usage: KLAVIYO_AUDIT_KEY=pk_... npx tsx scripts/klaviyo-audit.ts <slug>
import { metricByName } from "../lib/klaviyo/metrics";
import { mkdirSync, writeFileSync } from "node:fs";
import { klaviyo, klaviyoAll } from "../lib/klaviyo/api";

const key = process.env.KLAVIYO_AUDIT_KEY;
const slug = process.argv[2];
if (!key || !slug) throw new Error("Usage: KLAVIYO_AUDIT_KEY=pk_... npx tsx scripts/klaviyo-audit.ts <slug>");
const STATS = ["recipients", "delivered", "opens_unique", "open_rate", "clicks_unique", "click_rate", "conversions", "conversion_value", "revenue_per_recipient", "unsubscribe_rate"];
const days = (n: number) => ({ start: new Date(Date.now() - n * 864e5).toISOString().slice(0, 19), end: new Date().toISOString().slice(0, 19) });

async function report(kind: "campaign" | "flow", metricId: string, n: number) {
  const body = { data: { type: `${kind}-values-report`, attributes: { statistics: STATS, timeframe: days(n), conversion_metric_id: metricId } } };
  return (await klaviyo<any>(key!, `/${kind}-values-reports/`, { method: "POST", body })).data.attributes.results as any[];
}

async function main() {
  const acct = (await klaviyo<any>(key!, "/accounts/")).data[0].attributes;
  const metrics = (await klaviyoAll<any>(key!, "/metrics/")).data;
  const placed = await metricByName(key!, "Placed Order", metrics);
  if (!placed) throw new Error("No Placed Order metric: new account or no store connected — start from scratch");

  // Flows: top 10 by revenue, last 60 days (email + SMS messages summed per flow)
  const flows = new Map((await klaviyoAll<any>(key!, "/flows/")).data.map((f) => [f.id, f.attributes]));
  const fAgg = new Map<string, any>();
  for (const r of await report("flow", placed.id, 60)) {
    const id = r.groupings.flow_id, s = r.statistics, a = fAgg.get(id) ?? { recipients: 0, revenue: 0, conversions: 0, opens: 0, clicks: 0, channels: new Set() };
    a.recipients += s.recipients ?? 0; a.revenue += s.conversion_value ?? 0; a.conversions += s.conversions ?? 0; a.opens += s.opens_unique ?? 0; a.clicks += s.clicks_unique ?? 0; a.channels.add(r.groupings.send_channel);
    fAgg.set(id, a);
  }
  const topFlows = [...fAgg.entries()].map(([id, a]) => ({ name: flows.get(id)?.name ?? id, status: flows.get(id)?.status, trigger: flows.get(id)?.trigger_type, channels: [...a.channels].join("+"), recipients: a.recipients, revenue: Math.round(a.revenue), rpr: a.recipients ? +(a.revenue / a.recipients).toFixed(2) : 0, conversions: a.conversions }))
    .sort((x, y) => y.revenue - x.revenue).slice(0, 10);
  const liveFlows = [...flows.values()].filter((f: any) => f.status === "live").map((f: any) => f.name);

  // Campaigns: last 60 days, email, with subject lines
  const camps = new Map<string, any>();
  const since = new Date(Date.now() - 60 * 864e5).toISOString();
  for (const ch of ["email", "sms"]) {
    const { data, included } = await klaviyoAll<any>(key!, `/campaigns/?filter=and(equals(messages.channel,'${ch}'),greater-than(scheduled_at,${since}))&include=campaign-messages`);
    const msgs = new Map(included.filter((i) => i.type === "campaign-message").map((m) => [m.id, m.attributes]));
    for (const c of data) {
      const m: any = msgs.get(c.relationships?.["campaign-messages"]?.data?.[0]?.id);
      const content = m?.definition?.content ?? m?.content ?? {};
      camps.set(c.id, { name: c.attributes.name, channel: ch, sent: c.attributes.send_time ?? c.attributes.scheduled_at, status: c.attributes.status, subject: content.subject, preview: content.preview_text, body: ch === "sms" ? content.body : undefined, audiences: c.attributes.audiences });
    }
  }
  const rows: any[] = [];
  for (const r of await report("campaign", placed.id, 60)) {
    const c = camps.get(r.groupings.campaign_id); if (!c) continue; const s = r.statistics;
    rows.push({ ...c, recipients: s.recipients, open_rate: s.open_rate, click_rate: s.click_rate, conversions: s.conversions, revenue: Math.round(s.conversion_value ?? 0), rpr: s.revenue_per_recipient, unsub_rate: s.unsubscribe_rate });
  }
  const email = rows.filter((r) => r.channel === "email" && r.recipients > 100).sort((a, b) => (b.rpr ?? 0) - (a.rpr ?? 0));
  const avg = (k: string, xs: any[]) => xs.length ? +(xs.reduce((t, x) => t + (x[k] ?? 0), 0) / xs.length).toFixed(4) : null;

  // Lists and sign-up forms (names + sizes)
  const lists = (await klaviyoAll<any>(key!, "/lists/")).data.map((l) => ({ id: l.id, name: l.attributes.name, created: l.attributes.created?.slice(0, 10) }));
  let forms: any[] = [];
  try { forms = (await klaviyoAll<any>(key!, "/forms/")).data.map((f) => ({ name: f.attributes.name, status: f.attributes.status })); } catch { /* forms scope missing */ }

  const out = {
    pulled_at: new Date().toISOString(), window_days: 60,
    account: { name: acct.contact_information?.organization_name, sender: acct.contact_information?.default_sender_email, timezone: acct.timezone, currency: acct.preferred_currency },
    lists, forms: forms.filter((f) => f.status === "live"),
    flows: { live_count: liveFlows.length, live: liveFlows, top10_60d: topFlows },
    campaigns_60d: { email_sends: email.length, sms_sends: rows.filter((r) => r.channel === "sms").length, per_week: +(email.length / (60 / 7)).toFixed(1), avg_open_rate: avg("open_rate", email), avg_click_rate: avg("click_rate", email), best: email.slice(0, 5), worst: email.slice(-3).reverse(), all: email.map(({ name, sent, subject, open_rate, click_rate, revenue, rpr, recipients }) => ({ name, sent, subject, open_rate, click_rate, revenue, rpr, recipients })), sms: rows.filter((r) => r.channel === "sms") },
  };
  const dir = `clients/${slug}/research`; mkdirSync(dir, { recursive: true });
  const file = `${dir}/klaviyo-audit-${out.pulled_at.slice(0, 10)}.json`;
  writeFileSync(file, JSON.stringify(out, null, 1));
  console.log(`${out.account.name} · ${out.flows.live_count} live flows · ${email.length} email campaigns in 60d · saved ${file}`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
