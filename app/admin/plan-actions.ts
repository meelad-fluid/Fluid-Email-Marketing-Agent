"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/staff";
import { runPlan, startPlan } from "@/lib/strategy/plan";
import { regenerateSend, undoSendRevision } from "@/lib/strategy/send";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type ActionResult = { ok: true } | { ok: false; error: string };

const monthWindow = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return { period_start: new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10), period_end: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) };
};
const count = (v: FormDataEntryValue | null, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= 40 ? n : fallback;
};

// Plans a month for a client. The strategist runs in the background; the page shows its progress.
export async function planMonthAction(clientId: string, _prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const month = String(form.get("month") ?? "");
  if (!/^\d{4}-\d{2}$/.test(month)) return { ok: false, error: "Pick a month" };
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "The Claude API key isn't set up yet (ANTHROPIC_API_KEY)." };
  const id = await startPlan(
    clientId,
    { ...monthWindow(month), emails: count(form.get("emails"), 12), sms: count(form.get("sms"), 5), notes: String(form.get("notes") ?? "").slice(0, 4000) },
    { triggeredBy: "team", userId: staff.dev ? undefined : staff.id },
  );
  after(() => runPlan(id));
  revalidatePath(`/admin/c/${clientId}/calendar`);
  return { ok: true };
}

// Writes a new version of a plan with the team's feedback.
export async function regeneratePlanAction(planId: string, feedback: string): Promise<ActionResult> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const { data: plan } = await db.from("campaign_plans").select("client_id, inputs").eq("id", planId).single();
  if (!plan) return { ok: false, error: "Plan not found" };
  const id = await startPlan(plan.client_id, { ...(plan.inputs as any), feedback: feedback.slice(0, 4000), previous_plan_id: planId }, { triggeredBy: "team", userId: staff.dev ? undefined : staff.id });
  after(() => runPlan(id));
  revalidatePath(`/admin/c/${plan.client_id}/calendar`);
  return { ok: true };
}

// Approving puts the plan's sends into the pipeline as briefs.
export async function approvePlanAction(planId: string): Promise<ActionResult> {
  const staff = await requireStaff();
  const db = supabaseAdmin();
  const { data: plan } = await db.from("campaign_plans").select("client_id, period_start, status").eq("id", planId).single();
  if (!plan || plan.status !== "proposed") return { ok: false, error: "Only a proposed plan can be approved" };
  await db.from("campaign_plans").update({ status: "superseded" }).eq("client_id", plan.client_id).eq("period_start", plan.period_start).eq("status", "approved");
  await db.from("campaign_plans").update({ status: "approved", approved_at: new Date().toISOString(), approved_by: staff.dev ? null : staff.id }).eq("id", planId);
  revalidatePath(`/admin/c/${plan.client_id}`, "layout");
  return { ok: true };
}

export async function rejectPlanAction(planId: string): Promise<ActionResult> {
  await requireStaff();
  const db = supabaseAdmin();
  const { data: plan } = await db.from("campaign_plans").select("client_id").eq("id", planId).single();
  if (!plan) return { ok: false, error: "Plan not found" };
  await db.from("campaign_plans").update({ status: "rejected" }).eq("id", planId);
  revalidatePath(`/admin/c/${plan.client_id}/calendar`);
  return { ok: true };
}

// Rewrites one send with the team's feedback (takes about a minute; the drawer waits for it).
export async function regenerateSendAction(sendId: string, feedback: string): Promise<ActionResult> {
  await requireStaff();
  if (!feedback.trim()) return { ok: false, error: "Say what should change" };
  const r = await regenerateSend(sendId, feedback.slice(0, 4000));
  revalidatePath("/admin/c/[id]/calendar", "page");
  return r;
}

export async function undoSendAction(sendId: string): Promise<ActionResult> {
  await requireStaff();
  const r = await undoSendRevision(sendId);
  revalidatePath("/admin/c/[id]/calendar", "page");
  return r;
}
