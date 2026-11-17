// Read-only reporting tools for the Slack agent, bound to ONE client. The client id is fixed by the bot
// (from the Slack channel) when the tools are built; the model can't pass or change it, so these tools can
// only ever return this client's numbers.
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { db } from "./db";

const day = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
const money = (n: number) => Math.round(n * 100) / 100;
const ok = (o: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(o) }] });

export function clientDataServer(clientId: string) {
  const lastSync = async () => (await db().from("klaviyo_attributed_revenue_daily").select("synced_at").eq("client_id", clientId).order("synced_at", { ascending: false }).limit(1).maybeSingle()).data?.synced_at ?? null;

  const emailReport = tool(
    "email_report",
    "This client's email/SMS results for a date range (inclusive, client's timezone): Klaviyo-attributed revenue and orders by channel, split campaigns vs flows; number of campaign sends; total store revenue; top campaigns and flows in the range. Use for weekly/monthly recaps.",
    { start: z.string().describe("YYYY-MM-DD"), end: z.string().describe("YYYY-MM-DD") },
    async ({ start, end }) => {
      if (!day(start) || !day(end)) return ok({ error: "dates must be YYYY-MM-DD" });
      const [attr, store, camps, flows] = await Promise.all([
        db().from("klaviyo_attributed_revenue_daily").select("day, flow_id, channel, orders, revenue").eq("client_id", clientId).gte("day", start).lte("day", end),
        db().from("klaviyo_store_revenue_daily").select("orders, revenue").eq("client_id", clientId).gte("day", start).lte("day", end),
        db().from("klaviyo_campaigns").select("campaign_id, name, channel, send_time, subject, klaviyo_campaign_stats(conversions, conversion_value, recipients)").eq("client_id", clientId).gte("send_time", `${start}T00:00:00Z`).lte("send_time", `${end}T23:59:59Z`),
        db().from("klaviyo_flows").select("flow_id, name").eq("client_id", clientId),
      ]);
      for (const r of [attr, store, camps, flows]) if (r.error) return ok({ error: r.error.message });
      const sum = (rows: any[], f: (r: any) => boolean) => rows.filter(f).reduce((t, r) => ({ revenue: t.revenue + Number(r.revenue), orders: t.orders + r.orders }), { revenue: 0, orders: 0 });
      const a = attr.data ?? [];
      const by = (ch: string) => ({ total: sum(a, (r) => r.channel === ch), campaigns: sum(a, (r) => r.channel === ch && !r.flow_id), flows: sum(a, (r) => r.channel === ch && !!r.flow_id) });
      const flowName = new Map((flows.data ?? []).map((f) => [f.flow_id, f.name]));
      const flowTotals = new Map<string, number>();
      for (const r of a) if (r.flow_id) flowTotals.set(r.flow_id, (flowTotals.get(r.flow_id) ?? 0) + Number(r.revenue));
      const sent = (camps.data ?? []).filter((c: any) => c.send_time);
      const stats = (c: any) => (Array.isArray(c.klaviyo_campaign_stats) ? c.klaviyo_campaign_stats[0] : c.klaviyo_campaign_stats) ?? {};
      const st = store.data ?? [];
      return ok({
        range: { start, end },
        data_synced_at: await lastSync(),
        email: by("email"),
        sms: by("sms"),
        campaign_sends: { email: sent.filter((c: any) => c.channel === "email").length, sms: sent.filter((c: any) => c.channel === "sms").length },
        store_total: { revenue: money(st.reduce((t, r) => t + Number(r.revenue), 0)), orders: st.reduce((t, r) => t + r.orders, 0) },
        top_campaigns: sent.map((c: any) => ({ name: c.name, subject: c.subject, channel: c.channel, sent: c.send_time, revenue: money(Number(stats(c).conversion_value ?? 0)), orders: stats(c).conversions ?? 0, recipients: stats(c).recipients ?? 0 })).sort((x, y) => y.revenue - x.revenue).slice(0, 5),
        top_flows: [...flowTotals].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([id, rev]) => ({ name: flowName.get(id) ?? id, revenue: money(rev) })),
        note: "Campaign revenue/orders per campaign are Klaviyo's attributed totals since send. Revenue figures in email/sms are rounded only when you present them.",
      });
    },
  );

  const campaignResults = tool(
    "campaign_results",
    "Results for this client's campaigns whose name or subject matches the text (most recent first): attributed sales, orders, recipients, open and click rates.",
    { search: z.string().min(2) },
    async ({ search }) => {
      const s = search.replace(/[%,()]/g, " ").trim();
      const { data, error } = await db().from("klaviyo_campaigns").select("name, subject, channel, send_time, status, klaviyo_campaign_stats(recipients, delivered, opens_unique, clicks_unique, conversions, conversion_value)").eq("client_id", clientId).or(`name.ilike.%${s}%,subject.ilike.%${s}%`).order("send_time", { ascending: false, nullsFirst: false }).limit(8);
      if (error) return ok({ error: error.message });
      return ok({
        data_synced_at: await lastSync(),
        campaigns: (data ?? []).map((c: any) => {
          const st = (Array.isArray(c.klaviyo_campaign_stats) ? c.klaviyo_campaign_stats[0] : c.klaviyo_campaign_stats) ?? {};
          const d = st.delivered || st.recipients || 0;
          return { name: c.name, subject: c.subject, channel: c.channel, sent: c.send_time, status: c.status, sales: money(Number(st.conversion_value ?? 0)), orders: st.conversions ?? 0, recipients: st.recipients ?? 0, open_rate: d ? +(st.opens_unique / d).toFixed(3) : null, click_rate: d ? +(st.clicks_unique / d).toFixed(4) : null };
        }),
      });
    },
  );

  return createSdkMcpServer({ name: "fluid", version: "1.0.0", tools: [emailReport, campaignResults] });
}

export const DATA_TOOLS = ["mcp__fluid__email_report", "mcp__fluid__campaign_results"];
