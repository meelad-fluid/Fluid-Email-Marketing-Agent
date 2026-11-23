// Proactive check-ins, per client, in the client's own channel and timezone. Never spammy:
//   - Weekly report: Monday morning, last week's recap (skipped when there's no email data)
//   - Weekly win:    Thursday morning, ONE real result worth sharing (skipped when nothing genuinely stands out)
//   - Approvals:     weekday late morning, one combined message about emails still waiting for approval, only when a
//                    send date is close (≤ 4 days) or it has waited 3+ days; each email nudged at most every 3 days,
//                    at most 2 nudges a week (3 when a send date is tomorrow or today)
// Rules for all: weekdays only, never two proactive posts within 2 hours in a channel, every post or skip is
// recorded once in proactive_posts (so a restart never double-posts), and each kind can be switched off per client
// (/fluid proactive …).
import { db } from "./db";
import { flowLink, flowOf, publicUrl } from "./review";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CLIENTS_DIR } from "./config";

export type Client = { id: string; name: string; folder: string; timezone: string; proactive: { report?: boolean; wins?: boolean; approvals?: boolean } };
type Deps = {
  post: (channel: string, text: string) => Promise<string | undefined>;
  /** Run the agent for this client and post its answer top-level in the channel; returns null when it said SKIP or failed. */
  agentPost: (client: Client, channel: string, prompt: string, kind: string) => Promise<{ ts?: string; cost?: number; skipped: boolean; note?: string }>;
};

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Local weekday (0 = Sun), hour and date (YYYY-MM-DD) in a timezone. */
export function localNow(tz: string, now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "numeric", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map((x) => [x.type, x.value]));
  return { dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), hour: Number(p.hour), date: `${p.year}-${p.month}-${p.day}` };
}
export function isoWeek(date: string) {
  const d = new Date(`${date}T12:00:00Z`), day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return `${d.getUTCFullYear()}-W${String(1 + Math.round(((+d - +first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7)).padStart(2, "0")}`;
}
/** A readable email name: "2026-12-10-we-saved-your-spot" → "We saved your spot"; drops "Design · Fri Nov 20 ·" prefixes. */
export function niceTitle(t: string) {
  let x = t.split(/\s+[—–]\s+/).slice(-1)[0] || t;
  x = x.replace(/^(design|email|campaign)\s*·\s*/i, "").replace(/^(mon|tue|wed|thu|fri|sat|sun)\w*\.?\s+[a-z]{3}\w*\.?\s+\d{1,2}\s*·\s*/i, "");
  if (/^\d{4}-\d{2}-\d{2}-/.test(x)) { x = x.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/-/g, " "); x = x.charAt(0).toUpperCase() + x.slice(1); }
  return x.trim() || t;
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

/** "goes live Wed Dec 2, 2026" in a design README → 2026-12-02. */
export function goLiveDate(readme: string): string | null {
  const m = readme.match(/^Status:.*?goes live (?:[A-Z][a-z]{2}\w*\.?,?\s+)?([A-Z][a-z]{2})\w*\.?\s+(\d{1,2}),?\s+(\d{4})/m);
  if (!m) return null;
  const mi = MON.indexOf(m[1]);
  return mi < 0 ? null : `${m[3]}-${String(mi + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/** Claim a (client, kind, key) slot; false if it was already used. */
async function claim(clientId: string, kind: string, key: string, channel: string) {
  const { error } = await db().from("proactive_posts").insert({ client_id: clientId, kind, key, channel_id: channel });
  return !error;
}
const finish = (clientId: string, kind: string, key: string, r: { ts?: string; skipped: boolean; note?: string; cost?: number }) =>
  db().from("proactive_posts").update({ ts: r.ts ?? null, skipped: r.skipped, note: r.note ?? null, cost_usd: r.cost ?? null }).eq("client_id", clientId).eq("kind", kind).eq("key", key);

async function recentlyPosted(channel: string) {
  const { data } = await db().from("proactive_posts").select("created_at").eq("channel_id", channel).eq("skipped", false).gte("created_at", new Date(Date.now() - 2 * 3600_000).toISOString()).limit(1);
  return !!data?.length;
}

export const REPORT_PROMPT = `Proactive weekly report (nobody asked: you post this at the start of each week). Write the recap for LAST week (the previous Monday to Sunday, client's timezone) with email_report, in exactly the weekly recap shape from your rules, starting "Hey team, here's a quick recap for last week:". Follow ../../brain/skills/fluid-email-reporter/SKILL.md for what counts as working. If this client has no email data (no platform connected, or no sends last week), reply exactly SKIP and nothing else.`;
export const WIN_PROMPT = `Proactive weekly win (nobody asked). Look at the last 14 days: campaign_results and email_report for campaigns and flows, plus any A/B tests noted in memory.md or the design READMEs. Pick ONE genuine win: a campaign or flow clearly above this client's recent average (revenue, revenue per recipient, or click rate), an A/B test with a clear winner, or a record. Don't repeat a win already shared (memory.md lines with "win shared"). Reply with one or two short sentences, like a teammate texting the client: what happened, the real number, and one line on what we'll do with it next. Then append a dated "win shared: <what>" line to memory.md. If nothing genuinely stands out, reply exactly SKIP and nothing else. Never dress up a weak number as a win.`;

async function approvalsMessage(c: Client, today: string): Promise<{ text: string; ids: string[]; urgent: boolean } | null> {
  const { data: reviews } = await db().from("design_reviews").select("id, token, title, design_path, status, current_version, approved_version, updated_at").eq("client_id", c.id).gt("current_version", 0);
  const waiting = (reviews ?? []).filter((r) => !(r.status === "approved" && r.approved_version === r.current_version));
  if (!waiting.length) return null;
  // Emails nudged in the last 3 days are left alone.
  const { data: recent } = await db().from("proactive_posts").select("note").eq("client_id", c.id).eq("kind", "approvals").eq("skipped", false).gte("created_at", new Date(Date.now() - 3 * 86400_000).toISOString());
  const nudged = new Set((recent ?? []).flatMap((r) => { try { return JSON.parse(r.note ?? "[]"); } catch { return []; } }));
  const items: { id: string; title: string; link: string; live: string | null; days: number | null; flow?: string }[] = [];
  for (const r of waiting) {
    if (nudged.has(r.id)) continue;
    const readmePath = join(CLIENTS_DIR, c.folder, r.design_path, "README.md");
    const live = existsSync(readmePath) ? goLiveDate(readFileSync(readmePath, "utf8")) : null;
    const days = live ? daysBetween(today, live) : null;
    const waitedDays = Math.floor((Date.now() - Date.parse(r.updated_at)) / 86400_000);
    if (days !== null && days < 0) continue; // the date already passed: the team will re-plan it, no nudge
    if (!((days !== null && days <= 4) || waitedDays >= 3)) continue;
    items.push({ id: r.id, title: r.title, link: `${publicUrl()}/r/${r.token}`, live, days, flow: flowOf(r.title)?.flow });
  }
  if (!items.length) return null;
  // One line per flow, one per campaign, soonest first.
  const lines: { sort: number; text: string }[] = [];
  const flows = new Map<string, typeof items>();
  for (const i of items) if (i.flow) flows.set(i.flow, [...(flows.get(i.flow) ?? []), i]); else {
    const when = i.days === 0 ? "goes out today" : i.days === 1 ? "goes out tomorrow" : i.live ? `goes out ${new Date(`${i.live}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}` : "waiting a few days now";
    lines.push({ sort: i.days ?? 99, text: `• <${i.link}|${niceTitle(i.title)}> ${when}` });
  }
  for (const [flow, list] of flows) {
    const total = (reviews ?? []).filter((r) => flowOf(r.title)?.flow === flow).length;
    lines.push({ sort: Math.min(...list.map((x) => x.days ?? 99)), text: `• <${await flowLink(c.id, flow)}|${flow}>: ${list.length} of ${total} email${total > 1 ? "s" : ""} still waiting` });
  }
  lines.sort((a, b) => a.sort - b.sort);
  const urgent = items.some((i) => i.days !== null && i.days <= 1);
  const lead = items.length === 1 && !items[0].flow ? "Quick one, this still needs a thumbs up before it can go out:" : "Quick check, these still need approval before they can go out:";
  return { text: `${lead}\n${lines.map((l) => l.text).join("\n")}\n\nHit *Approve & build* on ${lines.length > 1 ? "each page and I'll get them" : "the page and I'll get it"} into ${existsSync(join(CLIENTS_DIR, c.folder, "memory.md")) && /Email platform:\s*Customer\.io/i.test(readFileSync(join(CLIENTS_DIR, c.folder, "memory.md"), "utf8")) ? "Customer.io" : "Klaviyo"} as a draft.`, ids: items.map((i) => i.id), urgent };
}

let running = false;
export async function proactiveTick(deps: Deps, now = new Date()) {
  if (running) return;
  running = true;
  try {
    const { data } = await db().from("slack_channels").select("channel_id, clients(id, name, folder, timezone, proactive)");
    const seen = new Set<string>();
    for (const row of (data ?? []) as any[]) {
      const c = row.clients as Client | null;
      if (!c || seen.has(c.id)) continue; // one channel per client
      seen.add(c.id);
      const tz = c.timezone || "America/New_York", p = c.proactive ?? {};
      const t = localNow(tz, now);
      if (t.dow === 0 || t.dow === 6) continue; // weekdays only
      const ch = row.channel_id as string, week = isoWeek(t.date);
      try {
        if (p.report !== false && t.dow === 1 && t.hour >= 9 && t.hour < 12 && !(await recentlyPosted(ch)) && (await claim(c.id, "report", week, ch))) {
          await finish(c.id, "report", week, await deps.agentPost(c, ch, REPORT_PROMPT, "weekly report"));
          continue;
        }
        if (p.wins !== false && t.dow === 4 && t.hour >= 10 && t.hour < 13 && !(await recentlyPosted(ch)) && (await claim(c.id, "win", week, ch))) {
          await finish(c.id, "win", week, await deps.agentPost(c, ch, WIN_PROMPT, "weekly win"));
          continue;
        }
        if (p.approvals !== false && t.hour >= 11 && t.hour < 14 && !(await recentlyPosted(ch))) {
          const { data: done } = await db().from("proactive_posts").select("key").eq("client_id", c.id).eq("kind", "approvals").like("key", `${t.date}%`).limit(1);
          if (done?.length) continue; // one nudge a day at most
          const m = await approvalsMessage(c, t.date);
          if (!m) continue;
          const { count } = await db().from("proactive_posts").select("id", { count: "exact", head: true }).eq("client_id", c.id).eq("kind", "approvals").eq("skipped", false).like("note", "[%").gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString());
          if ((count ?? 0) >= (m.urgent ? 3 : 2)) continue; // weekly cap
          const key = `${t.date}:${m.ids.length}`;
          if (!(await claim(c.id, "approvals", key, ch))) continue;
          const ts = await deps.post(ch, m.text);
          await finish(c.id, "approvals", key, { ts, skipped: !ts, note: JSON.stringify(m.ids) });
        }
      } catch (e: any) { console.error(`[proactive] ${c.name}:`, e.message); }
    }
  } finally { running = false; }
}
