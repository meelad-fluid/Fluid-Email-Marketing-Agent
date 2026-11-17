import { isCron } from "@/lib/auth/cron";
import { klaviyoClients } from "@/lib/clients/klaviyo-clients";
import { nextMonthWindow, runPlan, startPlan } from "@/lib/strategy/plan";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Monthly (the 20th): the strategist plans next month for every client with Klaviyo connected, so
// proposals are waiting for the team. Skips clients that already have a plan for that month.
export const maxDuration = 800;

export async function GET(req: Request) {
  if (!isCron(req)) return new Response("Unauthorized", { status: 401 });
  const window = nextMonthWindow();
  const results: Record<string, string> = {};
  for (const c of await klaviyoClients()) {
    const { count } = await supabaseAdmin()
      .from("campaign_plans")
      .select("id", { count: "exact", head: true })
      .eq("client_id", c.id)
      .eq("period_start", window.period_start)
      .in("status", ["generating", "proposed", "approved"]);
    if (count) {
      results[c.slug] = "already planned";
      continue;
    }
    const id = await startPlan(c.id, { ...window, emails: 12, sms: 5, notes: "" }, { triggeredBy: "schedule" });
    await runPlan(id);
    const { data } = await supabaseAdmin().from("campaign_plans").select("status, error").eq("id", id).single();
    results[c.slug] = data?.status === "proposed" ? "proposed" : `failed: ${data?.error}`;
  }
  return Response.json({ window, results });
}
