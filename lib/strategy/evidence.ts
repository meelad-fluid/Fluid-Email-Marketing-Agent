import { QUESTION_BY_ID } from "../onboarding/questions";
import { clientTimeZone } from "../onboarding/timezone";
import { supabaseAdmin } from "../supabase/admin";
import { momentsBetween, type Moment } from "./holidays";

// The evidence pack the strategist reads: the client's profile and their own results, computed in
// code so every number is exact. The model does the judgment (clusters, angles, the calendar).

export type EvidencePack = {
  client: { name: string; website: string | null; timezone: string };
  profile: Record<string, unknown>;
  window: { evidence_start: string; evidence_end: string; plan_start: string; plan_end: string };
  totals: { store_revenue_90d: number; email_revenue_90d: number; sms_revenue_90d: number; campaign_email_revenue_90d: number; flow_email_revenue_90d: number };
  campaigns: string; // CSV: one row per send, in date order, with its revenue and RPR rank
  campaign_content: { date: string; internal_name: string; subject: string | null; words: number; images: number; links: number; text: string }[]; // what each email said
  flows: string; // CSV
  already_scheduled: { date: string; channel: string; title: string }[];
  moments: Moment[];
};

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (header: string[], rows: unknown[][]) => [header.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");
const r2 = (n: number) => Math.round(n * 100) / 100;

export async function buildEvidence(clientId: string, planStart: string, planEnd: string): Promise<EvidencePack> {
  const db = supabaseAdmin();
  const [{ data: client }, { data: answers }] = await Promise.all([
    db.from("clients").select("name, website_url").eq("id", clientId).single(),
    db.from("profile_answers").select("question_id, answer").eq("client_id", clientId),
  ]);
  if (!client) throw new Error("Client not found");
  const profile: Record<string, unknown> = {};
  for (const a of answers ?? []) {
    const q = QUESTION_BY_ID.get(a.question_id);
    if (q && q.type !== "files" && q.type !== "connection" && a.answer != null && a.answer !== "") profile[a.question_id] = a.answer;
  }
  const tz = clientTimeZone(profile.timezone as string | undefined);

  // 90 complete days ending yesterday, in the client's timezone
  const today = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const end = new Date(Date.parse(today) - 864e5).toISOString().slice(0, 10);
  const start = new Date(Date.parse(today) - 90 * 864e5).toISOString().slice(0, 10);

  const [{ data: camps, error: ce }, { data: flows, error: fe }, { data: store }, { data: attributed }, { data: scheduled }] = await Promise.all([
    db
      .from("klaviyo_campaigns")
      .select("channel, name, subject, preview_text, sms_body, send_time, audiences, body_text, body_meta, klaviyo_campaign_stats(recipients, delivered, opens_unique, clicks_unique, conversions, conversion_value, unsubscribes)")
      .eq("client_id", clientId)
      .eq("status", "Sent")
      .gte("send_time", `${start}T00:00:00Z`)
      .lt("send_time", `${today}T00:00:00Z`)
      .order("send_time"),
    db.from("klaviyo_flows").select("flow_id, name, status, trigger_type, klaviyo_flow_stats(channel, timeframe, recipients, delivered, opens_unique, clicks_unique, conversions, conversion_value)").eq("client_id", clientId).eq("archived", false),
    db.from("klaviyo_store_revenue_daily").select("revenue").eq("client_id", clientId).gte("day", start).lte("day", end),
    db.from("klaviyo_attributed_revenue_daily").select("flow_id, channel, revenue").eq("client_id", clientId).gte("day", start).lte("day", end),
    db.from("klaviyo_campaigns").select("channel, name, subject, send_time").eq("client_id", clientId).in("status", ["Scheduled", "Sending"]).gte("send_time", `${planStart}T00:00:00Z`).lte("send_time", `${planEnd}T23:59:59Z`),
  ]);
  if (ce || fe) throw new Error((ce ?? fe)!.message);

  const statsOf = (c: any) => (Array.isArray(c.klaviyo_campaign_stats) ? c.klaviyo_campaign_stats[0] : c.klaviyo_campaign_stats);
  // Ranks within the window: revenue across all sends, RPR among sends with 500+ delivered (smaller ones are noise).
  const rank = (score: (c: any) => number | null) => {
    const scored = (camps ?? []).map((c: any) => [c, score(c)] as const).filter(([, v]) => v != null && v > 0).sort((a, b) => b[1]! - a[1]!);
    return new Map(scored.map(([c], i) => [c, i + 1]));
  };
  const revRank = rank((c) => Number(statsOf(c)?.conversion_value ?? 0));
  const rprRank = rank((c) => ((statsOf(c)?.delivered ?? 0) >= 500 ? Number(statsOf(c).conversion_value) / statsOf(c).delivered : null));

  const campaignRows = (camps ?? []).map((c: any) => {
    const s = statsOf(c);
    const d = s?.delivered || 0;
    const rev = Number(s?.conversion_value ?? 0);
    return [
      new Date(c.send_time).toLocaleDateString("en-CA", { timeZone: tz }),
      new Date(c.send_time).toLocaleDateString("en-US", { weekday: "short", timeZone: tz }),
      c.channel,
      c.name,
      c.channel === "email" ? c.subject : (c.sms_body ?? "").slice(0, 140),
      c.channel === "email" ? c.preview_text : "",
      d,
      d ? r2((100 * (s.opens_unique ?? 0)) / d) : "",
      d ? r2((100 * (s.clicks_unique ?? 0)) / d) : "",
      s?.conversions ?? 0,
      Math.round(rev),
      d ? r2(rev / d) : "",
      d ? r2((100 * (s.unsubscribes ?? 0)) / d) : "",
      revRank.get(c) ?? "",
      rprRank.get(c) ?? "",
    ];
  });
  const campaignContent = (camps ?? [])
    .filter((c: any) => c.channel === "email" && c.body_text)
    .map((c: any) => ({
      date: new Date(c.send_time).toLocaleDateString("en-CA", { timeZone: tz }),
      internal_name: c.name,
      subject: c.subject,
      words: c.body_meta?.words ?? 0,
      images: c.body_meta?.images ?? 0,
      links: c.body_meta?.links ?? 0,
      // The top sends in full, the rest enough to see what they set up.
      text: (c.body_text as string).slice(0, (revRank.get(c) ?? 99) <= 10 || (rprRank.get(c) ?? 99) <= 10 ? 3000 : 900),
    }));

  // Every non-archived flow, including live ones that sent nothing in 90 days (a broken flow is a finding).
  const flowRows = (flows ?? []).flatMap((f: any) => {
    const stats = (f.klaviyo_flow_stats ?? []).filter((s: any) => s.timeframe === "90d");
    if (!stats.length) return [[f.name, f.status, f.trigger_type ?? "", "", 0, "", 0, 0, "", f.status === "live" ? "live but sent nothing in 90 days" : ""]];
    return stats.map((s: any) => {
      const d = s.delivered || 0;
      return [f.name, f.status, f.trigger_type ?? "", s.channel, s.recipients, d ? r2((100 * s.clicks_unique) / d) : "", s.conversions, Math.round(Number(s.conversion_value)), d ? r2(Number(s.conversion_value) / d) : "", ""];
    });
  }).sort((a: any[], b: any[]) => (b[7] as number) - (a[7] as number));

  const sum = (rows: { revenue: number }[] | null, f: (r: any) => boolean = () => true) => Math.round((rows ?? []).filter(f).reduce((n, r) => n + Number(r.revenue), 0));
  return {
    client: { name: client.name, website: client.website_url, timezone: tz },
    profile,
    window: { evidence_start: start, evidence_end: end, plan_start: planStart, plan_end: planEnd },
    totals: {
      store_revenue_90d: sum(store),
      email_revenue_90d: sum(attributed as any, (r) => r.channel === "email"),
      sms_revenue_90d: sum(attributed as any, (r) => r.channel === "sms"),
      campaign_email_revenue_90d: sum(attributed as any, (r) => r.channel === "email" && r.flow_id === ""),
      flow_email_revenue_90d: sum(attributed as any, (r) => r.channel === "email" && r.flow_id !== ""),
    },
    campaigns: csv(["date", "weekday", "channel", "internal_name", "subject_or_sms_text", "preview_text", "delivered", "open_pct", "click_pct", "orders", "revenue", "rpr", "unsub_pct", "revenue_rank", "rpr_rank"], campaignRows),
    campaign_content: campaignContent,
    flows: csv(["flow", "status", "trigger", "channel", "recipients", "click_pct", "orders", "revenue", "rpr", "note"], flowRows),
    already_scheduled: (scheduled ?? []).map((s: any) => ({ date: new Date(s.send_time).toLocaleDateString("en-CA", { timeZone: tz }), channel: s.channel, title: s.subject ?? s.name })),
    moments: momentsBetween(planStart, planEnd),
  };
}
