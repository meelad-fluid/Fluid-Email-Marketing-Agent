import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { loadSkill } from "../brain/skills";
import { supabaseAdmin } from "../supabase/admin";
import { buildEvidence } from "./evidence";
import { PLAN_MODEL, type PlanInputs } from "./plan";
import { SendSchema, type PlanResult } from "./schema";

// Rewrites one send of a plan with the team's feedback, keeping the rest of the month as it is.
// The old version is kept on the row (revisions), newest last.

const SEND_FRAME = `You are running Fluid Creatives' email strategist skill (below) inside Fluid's app, on your own. A monthly plan already exists and the Fluid team wants ONE send in it rewritten. There is no live conversation:

- Return only the replacement send, in the required JSON format.
- Apply the team's feedback. Keep everything they didn't ask to change unless the feedback makes it inconsistent.
- The date must fall inside the plan window. Don't move it onto a day that already has a send on the same channel unless the feedback asks for that.
- The angle should be one of the plan's angle names unless the feedback asks for something new.
- Keep the month coherent: don't duplicate another send's topic, and keep the audience and value/promo mix in mind.
- Respect the client profile: never exceed max_discount, never discount what discount_exclusions names.
- Never invent facts about the client.`;

let anthropic: Anthropic | null = null;
const client = () => (anthropic ??= new Anthropic());

const SEND_FIELDS = ["send_date", "send_time", "channel", "name", "angle", "campaign_type", "topic", "segment", "audience", "format", "goal", "offer", "why", "test"] as const;

export async function regenerateSend(sendId: string, feedback: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = supabaseAdmin();
  const { data: send } = await db.from("plan_sends").select("*, campaign_plans!inner(id, status, client_id, inputs, result)").eq("id", sendId).single();
  if (!send) return { ok: false, error: "Send not found" };
  const plan = send.campaign_plans as { id: string; status: string; client_id: string; inputs: PlanInputs; result: Omit<PlanResult, "sends"> };
  if (!["proposed", "approved"].includes(plan.status)) return { ok: false, error: "This plan can't be changed any more" };
  if (send.stage !== "brief") return { ok: false, error: "This send is already in production" };

  const { data: others } = await db.from("plan_sends").select("send_date, send_time, channel, name, angle, campaign_type, topic, audience, offer").eq("plan_id", plan.id).neq("id", sendId).neq("stage", "dropped").order("send_date");
  const current = Object.fromEntries(SEND_FIELDS.map((k) => [k, send[k]]));

  try {
    const [skill, evidence] = await Promise.all([loadSkill("strategist"), buildEvidence(plan.client_id, plan.inputs.period_start, plan.inputs.period_end)]);
    const request = [
      `Rewrite one send in ${evidence.client.name}'s plan for ${plan.inputs.period_start} to ${plan.inputs.period_end}.`,
      `The team's feedback on this send:\n${feedback}`,
      `The send as it stands:\n${JSON.stringify(current)}`,
      `The plan's angles:\n${JSON.stringify(plan.result?.angles ?? [])}`,
      `The rest of the month (keep these as they are):\n${JSON.stringify(others ?? [])}`,
      plan.inputs.notes ? `What the team said about this window when planning:\n${plan.inputs.notes}` : "",
      `The evidence pack (the client's profile and own results, 90 complete days ending ${evidence.window.evidence_end}):\n${JSON.stringify(evidence, null, 1)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const stream = client().beta.messages.stream({
      model: PLAN_MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: betaZodOutputFormat(SendSchema) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: `${SEND_FRAME}\n\n${skill}`, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: request }],
    });
    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") return { ok: false, error: "The model declined to rewrite this send." };
    if (message.stop_reason === "max_tokens") return { ok: false, error: "The rewrite was cut off. Try again." };
    const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const parsed = SendSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return { ok: false, error: `The rewrite didn't match the expected format: ${parsed.error.issues[0]?.message}` };
    const s = parsed.data;
    const inWindow = s.date >= plan.inputs.period_start && s.date <= plan.inputs.period_end;

    const { error } = await db
      .from("plan_sends")
      .update({
        send_date: inWindow ? s.date : send.send_date,
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
        revisions: [...(send.revisions ?? []), { ...current, feedback, replaced_at: new Date().toISOString(), usage: message.usage }],
        updated_at: new Date().toISOString(),
      })
      .eq("id", sendId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Anthropic.AuthenticationError
          ? "The Claude API key is missing or invalid."
          : e instanceof Anthropic.RateLimitError
            ? "Claude is rate-limiting this account right now. Try again in a few minutes."
            : e instanceof Anthropic.APIError
              ? `Claude API error ${e.status}: ${e.message}`
              : (e as Error).message,
    };
  }
}

/** Puts back the version before the last rewrite. */
export async function undoSendRevision(sendId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = supabaseAdmin();
  const { data: send } = await db.from("plan_sends").select("revisions, stage").eq("id", sendId).single();
  const revisions = (send?.revisions ?? []) as Record<string, unknown>[];
  if (!send || !revisions.length) return { ok: false, error: "Nothing to undo" };
  if (send.stage !== "brief") return { ok: false, error: "This send is already in production" };
  const last = revisions[revisions.length - 1];
  const restored = Object.fromEntries(SEND_FIELDS.map((k) => [k, last[k] ?? null]));
  const { error } = await db.from("plan_sends").update({ ...restored, revisions: revisions.slice(0, -1), updated_at: new Date().toISOString() }).eq("id", sendId);
  return error ? { ok: false, error: error.message } : { ok: true };
}
