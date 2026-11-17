import { supabaseAdmin } from "../supabase/admin";
import type { PlanResult } from "./schema";

// Reads plans and planned sends for the internal view.

export type PlanRow = {
  id: string;
  status: "generating" | "proposed" | "approved" | "rejected" | "failed" | "superseded";
  period_start: string;
  period_end: string;
  inputs: { emails: number; sms: number; notes: string; feedback?: string };
  result: (Omit<PlanResult, "sends"> & { checks: string[] }) | null;
  error: string | null;
  triggered_by: "team" | "schedule";
  created_at: string;
  finished_at: string | null;
  approved_at: string | null;
};

export type PlannedSend = {
  id: string;
  plan_id: string;
  send_date: string;
  send_time: string | null;
  channel: "email" | "sms";
  angle: string;
  campaign_type: string;
  topic: string;
  segment: string;
  audience: string;
  format: string;
  goal: string;
  offer: string | null;
  name: string | null;
  why: string;
  test: string | null;
  stage: string;
  revisions: Record<string, unknown>[];
  updated_at: string;
};

const PLAN_COLS = "id, status, period_start, period_end, inputs, result, error, triggered_by, created_at, finished_at, approved_at";

/** The plan to show for a window: the newest that isn't superseded or rejected. */
export async function currentPlan(clientId: string, periodStart: string): Promise<PlanRow | null> {
  const { data } = await supabaseAdmin()
    .from("campaign_plans")
    .select(PLAN_COLS)
    .eq("client_id", clientId)
    .eq("period_start", periodStart)
    .not("status", "in", "(superseded,rejected)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as PlanRow) ?? null;
}

export async function planSends(planId: string): Promise<PlannedSend[]> {
  const { data } = await supabaseAdmin().from("plan_sends").select("*").eq("plan_id", planId).order("position");
  return (data as PlannedSend[]) ?? [];
}

/** Sends from proposed or approved plans in a date range (for the calendar). */
export async function plannedSendsBetween(clientId: string, from: string, to: string): Promise<(PlannedSend & { plan_status: string })[]> {
  const { data } = await supabaseAdmin()
    .from("plan_sends")
    .select("*, campaign_plans!inner(status)")
    .eq("client_id", clientId)
    .gte("send_date", from)
    .lte("send_date", to)
    .in("campaign_plans.status", ["proposed", "approved"])
    .neq("stage", "dropped");
  return (data ?? []).map((r: any) => ({ ...r, plan_status: r.campaign_plans.status }));
}

/** Sends from approved plans that are in production (for the pipeline board). */
export async function pipelineSends(clientId: string): Promise<PlannedSend[]> {
  const { data } = await supabaseAdmin()
    .from("plan_sends")
    .select("*, campaign_plans!inner(status)")
    .eq("client_id", clientId)
    .eq("campaign_plans.status", "approved")
    .not("stage", "in", "(sent,dropped)")
    .order("send_date");
  return (data as PlannedSend[]) ?? [];
}

/** One planned send with its plan's status, for the send drawer. */
export async function plannedSend(clientId: string, sendId: string): Promise<(PlannedSend & { plan_status: string }) | null> {
  const { data } = await supabaseAdmin().from("plan_sends").select("*, campaign_plans!inner(status)").eq("client_id", clientId).eq("id", sendId).maybeSingle();
  return data ? { ...(data as any), plan_status: (data as any).campaign_plans.status } : null;
}
