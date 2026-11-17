// Read-only reporting tools for the Slack agent, bound to ONE client. The client id is fixed by the bot
// (from the Slack channel) when the tools are built; the model can't pass or change it, so these tools can
// only ever return this client's numbers.
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { db } from "./db";
import { openComments, publishDesign, replyToComment, reviewByPath } from "./review";
import { pushEmail } from "../lib/klaviyo/push-email";
import { buildSegment, findAudiences } from "../lib/klaviyo/audiences";
import { CLIENTS_DIR } from "./config";
import { randomBytes } from "node:crypto";
import { existsSync as fileExists } from "node:fs";
import { join as pjoin, resolve as presolve, sep as psep } from "node:path";

const day = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
const money = (n: number) => Math.round(n * 100) / 100;
const ok = (o: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(o) }] });

export function clientDataServer(clientId: string, folder: string, slack?: { channel: string; thread: string }) {
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

  const publish = tool(
    "publish_design",
    "Publish (or update) a design's review link: the client-facing page where people see the email at full quality, leave pinned comments and approve. Call it every time you create or change a design. Same design folder = same link, new version. Returns the link.",
    { design_folder: z.string().describe("e.g. designs/2026-12-03-matcha-winback-20"), note: z.string().optional().describe("What changed in this version, one line") },
    async ({ design_folder, note }) => {
      try { const r = await publishDesign({ clientId, folder, designPath: design_folder, note, slack }); return ok({ link: r.url, version: r.version, status: r.review.status }); }
      catch (e: any) { return ok({ error: e.message }); }
    },
  );
  const comments = tool(
    "design_comments",
    "Open (unresolved) comments on a design's review link, with pin position (x,y in px on the 600px email), the version they were left on, and replies so far.",
    { design_folder: z.string() },
    async ({ design_folder }) => {
      const r = await reviewByPath(clientId, design_folder);
      if (!r) return ok({ error: "This design has no review link yet. Publish it first." });
      return ok({ link: `${(process.env.PUBLIC_URL ?? "").replace(/\/+$/, "")}/r/${r.token}`, current_version: r.current_version, status: r.status, comments: await openComments(r.id, r.current_version) });
    },
  );
  const reply = tool(
    "reply_to_comment",
    "Reply under a review comment (signed as Fluid). Set resolve=true once the change is made and published.",
    { design_folder: z.string(), comment_id: z.string(), text: z.string().min(1), resolve: z.boolean().default(true) },
    async ({ design_folder, comment_id, text, resolve }) => {
      const r = await reviewByPath(clientId, design_folder);
      if (!r) return ok({ error: "No review link for this design." });
      try { await replyToComment(r.id, comment_id, text, resolve); return ok({ ok: true }); } catch (e: any) { return ok({ error: e.message }); }
    },
  );

  const pushKlaviyo = tool(
    "push_to_klaviyo",
    "Build a finished design into this client's Klaviyo as a DRAFT campaign (never sends or schedules): slices it (each section/CTA its own linked image), QC checks every link, uploads the images, creates a drag-and-drop template and a draft campaign with the subject, preview text, sender and audiences from the copy file. Re-pushing updates the same draft (or creates the campaign if an earlier push had no audience). Audience names are matched loosely (e.g. 'engaged 120' finds 'FC | Engaged 120'); say which list each request was matched to. Only works if the client allows drafts.",
    { design_folder: z.string().describe("e.g. designs/2026-12-03-matcha-winback-20"), include: z.array(z.string()).optional().describe("Audiences to send to: exact Klaviyo names or ids from find_audiences. Overrides the copy doc."), exclude: z.array(z.string()).optional().describe("Audiences to exclude (names or ids). Overrides the copy doc.") },
    async ({ design_folder, include, exclude }) => {
      try {
        const r = await pushEmail({ clientsDir: CLIENTS_DIR, folder, designRel: design_folder.replace(/^\.\//, ""), db: db(), push: true, include, exclude });
        const k = r.klaviyo ?? {};
        return ok({ pushed: r.pushed, campaign: k.campaign?.name ?? null, updated_existing_draft: !!r.reusedDraft, slices: r.slices, audiences: k.audiences, missing_audiences: k.missing_audiences ?? [], suggestions: k.suggestions ?? {}, note: k.note, warnings: r.warnings });
      } catch (e: any) { return ok({ error: e.message }); }
    },
  );

  const find = tool(
    "find_audiences",
    "Search this client's Klaviyo lists and segments by what someone said ('engaged 120', '90 day engaged', 'VIPs', 'early access'). Returns the best matches with their exact names and ids (score 100 = exact).",
    { query: z.string().min(2) },
    async ({ query }) => { try { return ok({ matches: await findAudiences(db(), clientId, query) }); } catch (e: any) { return ok({ error: e.message }); } },
  );
  const build = tool(
    "build_segment",
    "Create a segment from Fluid's segmentation master sheet in this client's Klaviyo when the audience someone asked for doesn't exist: 'engaged <N>' (opened/clicked/checkout/ordered/active on site/added to cart in N days + can receive email), 'new subs' (Engaged 30 ex. Purchasers), 'placed order <N> days', 'lapsed customers' / 'winback'. Reuses it if it already exists. Never sends anything.",
    { request: z.string().describe("e.g. 'engaged 120'") },
    async ({ request }) => { try { const r = await buildSegment(db(), clientId, request); return ok("error" in r ? r : { created: r.created, name: r.audience.name, id: r.audience.id, definition: r.spec.purpose, note: "New segments take a few minutes to fill in Klaviyo." }); } catch (e: any) { return ok({ error: e.message }); } },
  );

  const publishDoc = tool(
    "publish_doc",
    "Share a markdown document from this client's folder (onboarding doc, plans, strategy) as a clean read-only web page. Same file = same link (always shows the latest version). Returns the link.",
    { path: z.string().describe("e.g. research/onboarding-doc.md"), title: z.string().min(2) },
    async ({ path, title }) => {
      const base = pjoin(CLIENTS_DIR, folder), file = presolve(base, path);
      if (!file.startsWith(base + psep) || !file.endsWith(".md") || !fileExists(file)) return ok({ error: "That .md file isn't in this client's folder." });
      const rel = file.slice(base.length + 1);
      const { data: existing } = await db().from("doc_links").select("token").eq("client_id", clientId).eq("path", rel).maybeSingle();
      const token = existing?.token ?? randomBytes(18).toString("base64url");
      if (!existing) await db().from("doc_links").insert({ token, client_id: clientId, path: rel, title });
      else await db().from("doc_links").update({ title }).eq("token", token);
      return ok({ link: `${(process.env.PUBLIC_URL ?? "").replace(/\/+$/, "")}/d/${token}` });
    },
  );

  return createSdkMcpServer({ name: "fluid", version: "1.0.0", tools: [emailReport, campaignResults, publish, comments, reply, pushKlaviyo, find, build, publishDoc] });
}

export const DATA_TOOLS = ["mcp__fluid__email_report", "mcp__fluid__campaign_results", "mcp__fluid__publish_design", "mcp__fluid__design_comments", "mcp__fluid__reply_to_comment", "mcp__fluid__push_to_klaviyo", "mcp__fluid__find_audiences", "mcp__fluid__build_segment", "mcp__fluid__publish_doc"];
