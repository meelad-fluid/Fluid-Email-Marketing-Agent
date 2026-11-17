// Runs the strategist agent for one client from the command line.
// Usage: npm run plan:month -- <client-slug> [--month 2026-11] [--emails 12] [--sms 5] [--notes "BFCM 25% off Nov 27-Dec 1"]
import { readFileSync } from "node:fs";

for (const [, k, v] of readFileSync(".env.local", "utf8").matchAll(/^([A-Z_]+)=(.*)$/gm)) process.env[k] ??= v.trim();
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

async function main() {
  const { supabaseAdmin } = await import("../lib/supabase/admin");
  const { nextMonthWindow, runPlan, startPlan } = await import("../lib/strategy/plan");
  const slug = process.argv[2];
  if (!slug || slug.startsWith("--")) throw new Error("Usage: npm run plan:month -- <client-slug> [--month YYYY-MM] [--emails N] [--sms N] [--notes text]");
  const { data: client } = await supabaseAdmin().from("clients").select("id, name").eq("slug", slug).single();
  if (!client) throw new Error(`No client "${slug}"`);
  const month = arg("month");
  const window = month
    ? { period_start: `${month}-01`, period_end: new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).toISOString().slice(0, 10) }
    : nextMonthWindow();
  const id = await startPlan(client.id, { ...window, emails: Number(arg("emails") ?? 12), sms: Number(arg("sms") ?? 5), notes: arg("notes") ?? "" }, { triggeredBy: "team" });
  console.log(`Planning ${client.name} ${window.period_start} → ${window.period_end} (plan ${id})…`);
  const t = Date.now();
  await runPlan(id);
  const { data } = await supabaseAdmin().from("campaign_plans").select("status, error, result, usage").eq("id", id).single();
  console.log(`${data!.status} in ${Math.round((Date.now() - t) / 1000)}s`);
  if (data!.status !== "proposed") return console.log(data!.error);
  const r: any = data!.result;
  console.log(`\n${r.headline}\n`);
  console.log("Angles:\n" + r.angles.map((a: any) => `  • ${a.name} (${a.slots}, ${a.purpose}) — ${a.justification}`).join("\n"));
  const { data: sends } = await supabaseAdmin().from("plan_sends").select("send_date, send_time, channel, angle, topic").eq("plan_id", id).order("position");
  console.log("\nCalendar:\n" + (sends ?? []).map((s) => `  ${s.send_date} ${s.send_time ?? ""} ${s.channel.padEnd(5)} [${s.angle}] ${s.topic}`).join("\n"));
  if (r.checks?.length) console.log("\nChecks: " + r.checks.join(" "));
  console.log(`\nTokens: ${JSON.stringify(data!.usage)}`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
