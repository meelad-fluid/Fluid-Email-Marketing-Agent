import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { loadSkill } from "../brain/skills";
import { supabaseAdmin } from "../supabase/admin";
import { buildEvidence } from "./evidence";
import { PlanResultSchema, type PlanResult } from "./schema";

// The strategist agent: runs brain/skills/fluid-email-strategist on a client's synced Klaviyo data
// and writes a proposed monthly calendar. Nothing reaches a customer from here: the plan waits for
// Fluid's approval, and every send still goes through copy, design and client approval.

export const PLAN_MODEL = "claude-opus-5-5";

export type PlanInputs = {
  period_start: string; // YYYY-MM-DD
  period_end: string;
  emails: number;
  sms: number;
  notes: string; // sales, launches, dates, anything the team knows
  feedback?: string; // when regenerating: what the team wants changed
  previous_plan_id?: string;
};

const AGENT_FRAME = `You are running Fluid Creatives' email strategist skill (below) inside Fluid's app, on your own. There is no live conversation:

- The skill's Step 5 gate is the Fluid team reviewing your plan in the app. Do Steps 1-5 and return the complete plan in the required JSON format; Step 6 (writing to the pipeline) happens when they approve it.
- The client's data is already queried for you in the user message (the brain's evidence pack). You don't run SQL. Treat it as the evidence the skill describes.
- Every send's date must fall inside the plan window, and its angle must be one of your angle names exactly.
- Hit the requested email and SMS counts unless the evidence gives you a strong reason not to; if you depart, say so in the headline or mix.
- Plan around the holidays and retail moments listed, and around the team's notes. Treat anything already scheduled in Klaviyo as fixed: don't double-book those days, and count them toward the month.
- Respect the client profile: never exceed max_discount, never discount what discount_exclusions names, use their real segment naming where you can infer it, and match their send-time habits from the evidence.
- Read the content of the top sends (campaign_content) and the sends before them, and plan this month's sequences on the patterns you find.
- Subject lines are the copywriter's job; don't write or direct them.
- First-time vs repeat revenue isn't available yet; don't guess it. Keep wholesale/B2B sends out of retail rankings.
- Never invent facts about the client. If you need something you don't have (a code, a product's stock), put it in open_questions.`;

let anthropic: Anthropic | null = null;
const client = () => (anthropic ??= new Anthropic());

export async function startPlan(clientId: string, inputs: PlanInputs, by: { triggeredBy: "team" | "schedule"; userId?: string }) {
  const { data, error } = await supabaseAdmin()
    .from("campaign_plans")
    .insert({ client_id: clientId, period_start: inputs.period_start, period_end: inputs.period_end, inputs, model: PLAN_MODEL, triggered_by: by.triggeredBy, created_by: by.userId ?? null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

/** Runs a plan that startPlan created. Never throws: failures are recorded on the plan. */
export async function runPlan(planId: string): Promise<void> {
  const db = supabaseAdmin();
  const { data: plan } = await db.from("campaign_plans").select("id, client_id, inputs").eq("id", planId).single();
  if (!plan) return;
  const inputs = plan.inputs as PlanInputs;
  try {
    const [skill, evidence] = await Promise.all([loadSkill("strategist"), buildEvidence(plan.client_id, inputs.period_start, inputs.period_end)]);
    let previous: PlanResult | null = null;
    if (inputs.previous_plan_id) {
      const { data } = await db.from("campaign_plans").select("result").eq("id", inputs.previous_plan_id).maybeSingle();
      previous = (data?.result as PlanResult) ?? null;
    }

    const request = [
      `Plan ${evidence.client.name}'s email and SMS for ${inputs.period_start} to ${inputs.period_end}: ${inputs.emails} emails and ${inputs.sms} SMS.`,
      inputs.notes ? `What the Fluid team says about this window:\n${inputs.notes}` : "The team added no notes for this window.",
      previous && inputs.feedback ? `This replaces an earlier version. The team's feedback on it:\n${inputs.feedback}\n\nThe earlier version, for reference:\n${JSON.stringify(previous)}` : "",
      `The evidence pack (the client's profile and own results, 90 complete days ending ${evidence.window.evidence_end}):\n${JSON.stringify(evidence, null, 1)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const stream = client().beta.messages.stream({
      model: PLAN_MODEL,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: betaZodOutputFormat(PlanResultSchema) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: `${AGENT_FRAME}\n\n${skill}`, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: request }],
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") throw new Error("The model declined to write this plan.");
    if (message.stop_reason === "max_tokens") throw new Error("The plan was cut off before it finished. Try fewer sends.");
    const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const parsed = PlanResultSchema.safeParse(JSON.parse(text));
    if (!parsed.success) throw new Error(`The plan didn't match the expected format: ${parsed.error.issues[0]?.message}`);
    await savePlanResult(planId, plan.client_id, inputs, parsed.data, { window: evidence.window, moments: evidence.moments }, message.usage);
  } catch (e) {
    const message =
      e instanceof Anthropic.AuthenticationError
        ? "The Claude API key is missing or invalid. Add ANTHROPIC_API_KEY to the app's environment."
        : e instanceof Anthropic.RateLimitError
          ? "Claude is rate-limiting this account right now. Try again in a few minutes."
          : e instanceof Anthropic.APIError
            ? `Claude API error ${e.status}: ${e.message}`
            : (e as Error).message;
    await db.from("campaign_plans").update({ status: "failed", error: message, finished_at: new Date().toISOString() }).eq("id", planId);
  }
}

/** Validates and stores a finished plan: its sends, its summary, and checks the format can't express. */
export async function savePlanResult(planId: string, clientId: string, inputs: PlanInputs, result: PlanResult, context: { window: unknown; moments: unknown }, usage: unknown) {
  const db = supabaseAdmin();
  // Checks the format can't express. Problems are kept and shown to the team, not hidden.
  const angleNames = new Set(result.angles.map((a) => a.name));
  const checks: string[] = [];
  const outside = result.sends.filter((s) => s.date < inputs.period_start || s.date > inputs.period_end);
  if (outside.length) checks.push(`${outside.length} send(s) fall outside the plan window and were dropped.`);
  const orphan = result.sends.filter((s) => !angleNames.has(s.angle));
  if (orphan.length) checks.push(`${orphan.length} send(s) name an angle that isn't in the plan: ${[...new Set(orphan.map((s) => s.angle))].join(", ")}.`);
  const kept = result.sends.filter((s) => s.date >= inputs.period_start && s.date <= inputs.period_end).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const emails = kept.filter((s) => s.channel === "email").length, sms = kept.filter((s) => s.channel === "sms").length;
  if (emails !== inputs.emails || sms !== inputs.sms) checks.push(`Planned ${emails} emails and ${sms} SMS (asked for ${inputs.emails} and ${inputs.sms}).`);

  const { error: sendError } = await db.from("plan_sends").insert(
    kept.map((s, i) => ({
      plan_id: planId,
      client_id: clientId,
      position: i,
      send_date: s.date,
      send_time: s.time,
      channel: s.channel,
      name: s.name,
      angle: s.angle,
      campaign_type: s.campaign_type,
      topic: s.topic,
      segment: s.segment,
      audience: s.audience,
      format: s.channel === "sms" ? "sms" : s.format === "sms" ? "designed" : s.format,
      goal: s.goal,
      offer: s.offer,
      why: s.why,
      test: s.test,
    })),
  );
  if (sendError) throw new Error(`Saving the sends: ${sendError.message}`);

  const { sends: _sends, ...summary } = result;
  await db
    .from("campaign_plans")
    .update({ status: "proposed", result: { ...summary, checks, evidence_window: context.window, moments: context.moments }, usage, finished_at: new Date().toISOString() })
    .eq("id", planId);
  // A newer proposal for the same window replaces older open ones.
  await db
    .from("campaign_plans")
    .update({ status: "superseded" })
    .eq("client_id", clientId)
    .eq("period_start", inputs.period_start)
    .eq("status", "proposed")
    .neq("id", planId);
}

/** Next calendar month in the client's sense of time, as plan dates. */
export function nextMonthWindow(now = new Date()) {
  const y = now.getUTCMonth() === 11 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
  const m = (now.getUTCMonth() + 1) % 12;
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0));
  return { period_start: start.toISOString().slice(0, 10), period_end: end.toISOString().slice(0, 10) };
}
