// Read-only reporting tools for the Slack agent, bound to ONE client. The client id is fixed by the bot
// (from the Slack channel) when the tools are built; the model can't pass or change it, so these tools can
// only ever return this client's numbers.
import { checkDesignCutoffs, cutoffSummary } from "../lib/email/qc";
import { cioCreds } from "../lib/customerio/api";
import { cioReport } from "../lib/customerio/report";
import { cioSegments, matchSegments, pushToCustomerio } from "../lib/customerio/push";
import { emailText, isRuoClient, ruoSummary, scanRuoText } from "../lib/compliance/ruo";
import { dcToHtml } from "../lib/email/dc";
import { parseCalendarMarkdown } from "../lib/strategy/calendar";
import { readFileSync as readText } from "node:fs";
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { db } from "./db";
import { openComments, publishDesign, replyToComment, reviewByPath } from "./review";
import { pushEmail } from "../lib/klaviyo/push-email";
import { runAudits } from "./onboarding";
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

  // Customer.io clients (all peptide brands): reports come live from Customer.io's API instead of the Klaviyo sync.
  const cio = async () => {
    const { data: k } = await db().from("client_connections").select("provider").eq("client_id", clientId).eq("status", "connected");
    const providers = (k ?? []).map((x) => x.provider);
    return providers.includes("customerio") && !providers.includes("klaviyo") ? await cioCreds(db(), clientId) : null;
  };

  const emailReport = tool(
    "email_report",
    "This client's email/SMS results for a date range (inclusive, client's timezone): Klaviyo-attributed revenue and orders by channel, split campaigns vs flows; number of campaign sends; total store revenue; top campaigns and flows in the range. Use for weekly/monthly recaps.",
    { start: z.string().describe("YYYY-MM-DD"), end: z.string().describe("YYYY-MM-DD") },
    async ({ start, end }) => {
      if (!day(start) || !day(end)) return ok({ error: "dates must be YYYY-MM-DD" });
      const c = await cio();
      if (c) {
        try {
          const r = await cioReport(c, start, end);
          return ok({ platform: "Customer.io (live)", range: r.range, email: { total: { revenue: r.totals.email_revenue, orders: r.totals.orders }, campaigns: { revenue: r.totals.campaign_revenue }, flows: { revenue: r.totals.flow_revenue } }, campaign_sends: { email: r.totals.sends }, top_campaigns: r.campaigns.slice(0, 5), top_flows: r.flows.slice(0, 5), order_event: r.order_event, note: `${r.revenue_window_note} Revenue = the client's order events attributed to the last email opened or clicked within 5 days before the order. No store total or SMS from Customer.io.` });
        } catch (e: any) { return ok({ error: `Customer.io: ${e.message}` }); }
      }
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
      const c = await cio();
      if (c) {
        try {
          const end = new Date().toISOString().slice(0, 10), start = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
          const r = await cioReport(c, start, end);
          const hits = r.campaigns.filter((x) => x.name.toLowerCase().includes(s.toLowerCase()));
          return ok({ platform: "Customer.io (live)", note: r.revenue_window_note, campaigns: hits.map((x) => ({ name: x.name, sent: x.sent_at, sales: x.revenue, orders: x.orders, recipients: x.sent, open_rate: x.sent ? +(x.opened / x.sent).toFixed(3) : null, click_rate: x.sent ? +(x.clicked / x.sent).toFixed(4) : null })) });
        } catch (e: any) { return ok({ error: `Customer.io: ${e.message}` }); }
      }
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

  // Research-use-only clients: refuse designs (and their subject/preview) with wording the RUO SOP prohibits.
  function ruoProblem(designFolder: string): string | null {
    const base = pjoin(CLIENTS_DIR, folder);
    if (!isRuoClient(base)) return null;
    const dir = pjoin(base, designFolder.replace(/^\.\//, "")), dc = pjoin(dir, "design.dc.html");
    let text = "";
    try { if (fileExists(dc)) text += emailText(dcToHtml(dc, base)); } catch { /* the design check below reports a broken design */ }
    const readme = pjoin(dir, "README.md");
    const copyRel = fileExists(readme) ? readText(readme, "utf8").match(/\*\*Copy:\*\*\s*`([^`]+)`/)?.[1] : undefined;
    const copyFile = copyRel ? presolve(dir, copyRel) : undefined;
    if (copyFile && copyFile.startsWith(base + psep) && fileExists(copyFile)) text += "\n" + readText(copyFile, "utf8").split("\n").filter((l) => /^(SUBJECT|PREVIEW|- \*\*Subject|- \*\*Preview)/i.test(l)).join("\n");
    const hits = scanRuoText(text, base);
    return hits.length ? `Not published: this is a research-use-only client and the email has wording the RUO SOP prohibits. Rewrite these (no human benefits, medical, use or effect-category language), re-run the compliance gate, then try again.\n${ruoSummary(hits)}` : null;
  }

  const publish = tool(
    "publish_design",
    "Publish (or update) a design's review link: the client-facing page where people see the email at full quality, leave pinned comments and approve. Call it every time you create or change a design. Same design folder = same link, new version. Returns the link.",
    { design_folder: z.string().describe("e.g. designs/2026-12-03-matcha-winback-20"), note: z.string().optional().describe("What changed in this version, one line"),
      ignore_cutoffs: z.boolean().default(false).describe("Only for a deliberate bleed of plain background texture. Never for products, people, logos or text.") },
    async ({ design_folder, note, ignore_cutoffs }) => {
      const ruo = ruoProblem(design_folder);
      if (ruo) return ok({ error: ruo });
      const dc = pjoin(CLIENTS_DIR, folder, design_folder.replace(/^\.\//, ""), "design.dc.html");
      if (fileExists(dc) && !ignore_cutoffs) {
        try {
          const cut = await checkDesignCutoffs(dc, pjoin(CLIENTS_DIR, folder));
          if (cut.length) return ok({ error: `Not published: parts of the design are cut off. Fix these, check with render_preview, then publish again.\n${cutoffSummary(cut)}` });
        } catch (e: any) { console.error("[qc]", e.message); }
      }
      try { const r = await publishDesign({ clientId, folder, designPath: design_folder, note, slack }); return ok({ link: r.url, version: r.version, status: r.review.status, ...(r.flow_url ? { flow_link: r.flow_url, note: "This email is part of a flow: share the flow_link (one link with every email of the flow) instead of separate links." } : {}) }); }
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
      const ruo = ruoProblem(design_folder);
      if (ruo) return ok({ error: ruo });
      try {
        const r = await pushEmail({ clientsDir: CLIENTS_DIR, folder, designRel: design_folder.replace(/^\.\//, ""), db: db(), push: true, include, exclude });
        const k = r.klaviyo ?? {};
        return ok({ pushed: r.pushed, campaign: k.campaign?.name ?? null, updated_existing_draft: !!r.reusedDraft, slices: r.slices, audiences: k.audiences, missing_audiences: k.missing_audiences ?? [], suggestions: k.suggestions ?? {}, note: k.note, warnings: r.warnings });
      } catch (e: any) { return ok({ error: e.message }); }
    },
  );

  const pushCio = tool(
    "push_to_customerio",
    "For Customer.io clients (all peptide brands): build a finished design into their Customer.io as a DRAFT one-time send (never sends or schedules). Slices and QC-checks it like the Klaviyo push, uploads the images to Customer.io, and creates the draft with the subject, preview, sender and segments from the copy file (re-pushing updates the same draft). Only works if the client allows drafts.",
    { design_folder: z.string(), include: z.array(z.string()).optional().describe("Customer.io segment names or ids to send to (overrides the copy doc)"), exclude: z.array(z.string()).optional() },
    async ({ design_folder, include, exclude }) => {
      const ruo = ruoProblem(design_folder);
      if (ruo) return ok({ error: ruo });
      try { return ok(await pushToCustomerio({ clientsDir: CLIENTS_DIR, folder, designRel: design_folder.replace(/^\.\//, ""), db: db(), include, exclude })); }
      catch (e: any) { return ok({ error: e.message }); }
    },
  );

  const find = tool(
    "find_audiences",
    "Search this client's Klaviyo lists and segments by what someone said ('engaged 120', '90 day engaged', 'VIPs', 'early access'). Returns the best matches with their exact names and ids (score 100 = exact).",
    { query: z.string().min(2) },
    async ({ query }) => {
      try {
        const c = await cio();
        if (c) return ok({ platform: "Customer.io", matches: matchSegments(await cioSegments(c), query).slice(0, 8), note: "Customer.io segments are built in their app (the API can't create data-driven segments); write the segment spec if one is missing." });
        return ok({ matches: await findAudiences(db(), clientId, query) });
      } catch (e: any) { return ok({ error: e.message }); }
    },
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

  const publishCalendar = tool(
    "publish_calendar",
    "Share a campaign calendar (a strategy .md written in the calendar format: '**Mon Nov 23 · Email · Title**' headers with '- Label: value' bullets) as a calendar page: month grid opening on today, sends colour-coded value / promo / SMS, click a send to see its brief. Same file = same link. Use it for every campaign calendar or monthly plan, and share this link instead of the doc.",
    { path: z.string().describe("e.g. strategy/2026-11-22-30-day-calendar.md") },
    async ({ path }) => {
      const base = pjoin(CLIENTS_DIR, folder), file = presolve(base, path);
      if (!file.startsWith(base + psep) || !file.endsWith(".md") || !fileExists(file)) return ok({ error: "That .md file isn't in this client's folder." });
      const cal = parseCalendarMarkdown(readText(file, "utf8"));
      if (!cal.sends.length) return ok({ error: "No sends found. Each send needs a header line like '**Mon Nov 23 · Email · Title**' followed by '- Label: value' bullets." });
      const rel = file.slice(base.length + 1);
      const { data: existing } = await db().from("doc_links").select("token").eq("client_id", clientId).eq("path", rel).maybeSingle();
      const token = existing?.token ?? randomBytes(18).toString("base64url");
      if (!existing) await db().from("doc_links").insert({ token, client_id: clientId, path: rel, title: cal.title });
      return ok({ link: `${(process.env.PUBLIC_URL ?? "").replace(/\/+$/, "")}/c/${token}`, sends: cal.sends.length, emails: cal.sends.filter((x) => x.channel !== "sms").length, sms: cal.sends.filter((x) => x.channel !== "email").length, promo: cal.sends.filter((x) => x.type === "promo").length });
    },
  );

  const audits = tool(
    "run_onboarding_audits",
    "Run the read-only Klaviyo audit (top flows, last 60 days of campaigns, lists, forms) and order data (bestsellers, repeat rate, reorder gap, cohorts) for this client, saving JSON into research/, and sync reporting data. Needs the client's Klaviyo key (connected through their onboarding link). Takes a few minutes.",
    {},
    async () => { try { return ok(await runAudits(clientId, folder)); } catch (e: any) { return ok({ error: e.message }); } },
  );

  return createSdkMcpServer({ name: "fluid", version: "1.0.0", tools: [emailReport, campaignResults, publish, comments, reply, pushKlaviyo, pushCio, find, build, publishDoc, publishCalendar, audits] });
}

export const DATA_TOOLS = ["mcp__fluid__email_report", "mcp__fluid__campaign_results", "mcp__fluid__publish_design", "mcp__fluid__design_comments", "mcp__fluid__reply_to_comment", "mcp__fluid__push_to_klaviyo", "mcp__fluid__push_to_customerio", "mcp__fluid__find_audiences", "mcp__fluid__build_segment", "mcp__fluid__publish_doc", "mcp__fluid__publish_calendar", "mcp__fluid__run_onboarding_audits"];
