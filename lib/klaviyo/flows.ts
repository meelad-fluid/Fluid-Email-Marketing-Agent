// Builds a NEW flow in a client's Klaviyo from Fluid's flow plan file, as a Draft (Klaviyo's Create Flow API,
// revision 2026-10-15). Never touches an existing flow: there is no update/delete path, the write guard
// (lib/klaviyo/write.ts) only allows POST /flows with new, draft-only actions, and a plan that was already
// built is refused unless the caller asks for a fresh copy.
//
// Plan file (JSON, written by the agent in flows/<name>.json):
// {
//   "name": "Welcome Flow",                              → Klaviyo name "FC | Welcome Flow (draft)"
//   "trigger": { "list": "Newsletter" } | { "segment": "…" } | { "metric": "Started Checkout" },
//   "steps": [
//     { "email": "designs/welcome-flow-01-matcha" },     → template from the design + subject/preview/from from its copy
//     { "wait": { "days": 1 } },                         → also "hours"
//     { "sms": "Text body …" },
//     { "split": [ { "when": { "property": "stocking_up_on", "equals": "Matcha" }, "steps": [ … ] },
//                  { "when": { "property": "stocking_up_on", "in": ["Cacao", "Baking"] }, "steps": [ … ] } ],
//       "otherwise": [ … ] },                            → nested conditional splits; steps AFTER a split run on every branch
//     …
//   ],
//   "exit_if_ordered": true                              → flow filter: has not placed an order since starting this flow
// }
import { metricByName } from "./metrics";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { allAudiences, keyFor, pick } from "./audiences";
import { klaviyo, klaviyoAll } from "./api";
import { copyMeta, pushEmail } from "./push-email";
import { draftWriter, flowBodyProblem } from "./write";

export const FLOW_REVISION = "2026-10-15";

const When = z.object({
  property: z.string().optional().describe("profile property, e.g. stocking_up_on"),
  equals: z.string().optional(), in: z.array(z.string()).optional(), is_set: z.boolean().optional(),
  in_audience: z.string().optional().describe("list or segment name: is the person in it?"),
});
type Step = { email?: string; wait?: { days?: number; hours?: number }; sms?: string; split?: { when: z.infer<typeof When>; steps: Step[] }[]; otherwise?: Step[] };
const StepSchema: z.ZodType<Step> = z.lazy(() => z.object({
  email: z.string().optional(), wait: z.object({ days: z.number().int().min(0).optional(), hours: z.number().int().min(0).optional() }).optional(), sms: z.string().optional(),
  split: z.array(z.object({ when: When, steps: z.array(StepSchema) })).optional(), otherwise: z.array(StepSchema).optional(),
}));
export const FlowPlanSchema = z.object({
  name: z.string().min(2),
  trigger: z.object({ list: z.string().optional(), segment: z.string().optional(), metric: z.string().optional() }),
  steps: z.array(StepSchema).min(1),
  exit_if_ordered: z.boolean().optional(),
});
export type FlowPlan = z.infer<typeof FlowPlanSchema>;

type Ctx = { templates: Map<string, { template_id: string; subject: string; preview: string; name: string; fromLabel: string }>; audiences: Map<string, string>; from: { email: string; label: string }; n: number };
const tid = (ctx: Ctx, p: string) => `${p}-${++ctx.n}`;

/** Compile steps into Klaviyo actions. Returns the first action's temporary id ("" if no steps). */
function compile(steps: Step[], ctx: Ctx, out: any[], tail: Step[] = []): string | null {
  const all = [...steps, ...tail];
  if (!all.length) return null;
  const [s, ...rest] = all;
  if (s.split?.length) {
    // Each condition becomes a yes/no split; "no" falls through to the next condition, then to "otherwise".
    // Steps after the split are copied onto every branch (Klaviyo branches never rejoin).
    const chain = (i: number): string | null => {
      if (i >= s.split!.length) return compile(s.otherwise ?? [], ctx, out, rest);
      const c = s.split![i], id = tid(ctx, "split");
      const action: any = { temporary_id: id, type: "conditional-split", links: {}, data: { profile_filter: { condition_groups: [{ conditions: [condition(c.when, ctx)] }] } } };
      out.push(action);
      action.links.next_if_true = compile(c.steps, ctx, out, rest);
      action.links.next_if_false = chain(i + 1);
      return id;
    };
    return chain(0);
  }
  const id = tid(ctx, s.email ? "email" : s.sms ? "sms" : "wait");
  const action: any = { temporary_id: id, links: { next: null } };
  if (s.email) {
    const t = ctx.templates.get(s.email)!;
    Object.assign(action, { type: "send-email", data: { status: "draft", message: { name: t.name.slice(0, 120), from_email: ctx.from.email, from_label: t.fromLabel || ctx.from.label, subject_line: t.subject, preview_text: t.preview, template_id: t.template_id, smart_sending_enabled: true, transactional: false, add_tracking_params: true } } });
  } else if (s.sms) {
    Object.assign(action, { type: "send-sms", data: { status: "draft", message: { body: s.sms, smart_sending_enabled: true, transactional: false, add_tracking_params: true } } });
  } else if (s.wait) {
    const hours = (s.wait.days ?? 0) * 24 + (s.wait.hours ?? 0);
    Object.assign(action, { type: "time-delay", data: hours % 24 === 0 ? { unit: "days", value: hours / 24, timezone: "profile" } : { unit: "hours", value: hours, timezone: "profile" } });
  } else throw new Error(`A step has nothing in it: ${JSON.stringify(s)}`);
  out.push(action);
  action.links.next = compile(rest, ctx, out);
  return id;
}

function condition(w: z.infer<typeof When>, ctx: Ctx) {
  if (w.in_audience) return { type: "profile-group-membership", is_member: true, group_ids: [ctx.audiences.get(w.in_audience)!] };
  if (!w.property) throw new Error("A split needs a property or in_audience");
  const property = /^[a-z_$][\w$]*$/i.test(w.property) && !w.property.startsWith("$") && !["email", "phone_number", "first_name", "last_name"].includes(w.property) ? `properties['${w.property}']` : w.property;
  const filter = w.in ? { type: "string", operator: "in", value: w.in } : w.is_set !== undefined ? { type: "existence", operator: w.is_set ? "is-set" : "not-set" } : { type: "string", operator: "equals", value: w.equals ?? "" };
  return { type: "profile-property", property, filter };
}

/** The Klaviyo definition for a plan, given resolved templates/audiences (used by buildFlow; exported for tests). */
export function planDefinition(plan: FlowPlan, templates: Ctx["templates"], audiences: Map<string, string>, from: Ctx["from"], trigger: any) {
  const ctx: Ctx = { templates, audiences, from, n: 0 }, actions: any[] = [];
  const entry = compile(plan.steps, ctx, actions);
  return { triggers: [trigger], profile_filter: null, entry_action_id: entry, actions };
}

function walk(steps: Step[], f: (s: Step) => void) { for (const s of steps) { f(s); for (const b of s.split ?? []) walk(b.steps, f); walk(s.otherwise ?? [], f); } }

export type BuildResult = { created: boolean; flow_id?: string; flow_name: string; url?: string; status?: string; emails: number; sms: number; splits: number; verified_draft: boolean; manual_steps: string[]; warnings: string[] };

export async function buildFlow(o: { clientsDir: string; folder: string; planRel: string; db: SupabaseClient; freshCopy?: boolean; log?: (s: string) => void }): Promise<BuildResult> {
  const log = o.log ?? (() => {});
  const clientDir = resolve(o.clientsDir, o.folder), planFile = resolve(clientDir, o.planRel);
  if (!planFile.startsWith(clientDir + sep) || !existsSync(planFile)) throw new Error("That flow plan isn't in this client's folder.");
  const plan = FlowPlanSchema.parse(JSON.parse(readFileSync(planFile, "utf8")));
  const statePath = planFile.replace(/\.json$/, "") + ".klaviyo.json";
  const prev = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : null;
  if (prev?.flow_id && !o.freshCopy) throw new Error(`This flow was already built in Klaviyo as "${prev.flow_name}" (${prev.url}). Fluid never edits a flow once it exists: change it in Klaviyo, or ask for a fresh copy (a new draft flow).`);

  const { data: client } = await o.db.from("clients").select("id, name").eq("folder", o.folder).single();
  if (!client) throw new Error(`No client with folder ${o.folder}`);
  await draftWriter(o.db, client.id); // fails early unless drafts are allowed
  const key = await keyFor(o.db, client.id);

  // Every email in the plan → a Klaviyo template (reused when the design hasn't changed since its last push).
  const emails: string[] = [], audNames: string[] = [];
  let sms = 0, splits = 0;
  walk(plan.steps, (s) => { if (s.email && !emails.includes(s.email)) emails.push(s.email); if (s.sms) sms++; for (const b of s.split ?? []) { splits++; if (b.when.in_audience) audNames.push(b.when.in_audience); } });
  const templates: Ctx["templates"] = new Map(), warnings: string[] = [];
  for (const rel of emails) {
    const designDir = resolve(clientDir, rel);
    if (!designDir.startsWith(clientDir + sep) || !existsSync(designDir)) throw new Error(`No design folder ${rel}`);
    const meta = copyMeta(designDir, rel);
    if (!meta.subject || !meta.preview) throw new Error(`${rel}: the copy file needs SUBJECT (pick) and PREVIEW (pick) lines`);
    const kFile = join(designDir, "build", "klaviyo.json"), dc = join(designDir, "design.dc.html");
    const k = existsSync(kFile) ? JSON.parse(readFileSync(kFile, "utf8")) : null;
    const fresh = k?.template_id && existsSync(dc) && statSync(kFile).mtimeMs > statSync(dc).mtimeMs;
    let templateId = fresh ? k.template_id : null;
    if (!templateId) {
      log(`template: ${rel}`);
      const r = await pushEmail({ clientsDir: o.clientsDir, folder: o.folder, designRel: rel, db: o.db, push: true, templateOnly: true });
      templateId = r.klaviyo.template_id;
      warnings.push(...r.warnings.map((w) => `${rel}: ${w}`));
    }
    templates.set(rel, { template_id: templateId, subject: meta.subject, preview: meta.preview, name: meta.name, fromLabel: meta.fromLabel });
  }

  // Trigger + any audiences used in splits.
  const audiences = new Map<string, string>(), manual: string[] = [];
  const needAud = [plan.trigger.list, plan.trigger.segment, ...audNames].filter(Boolean) as string[];
  const all = needAud.length ? await allAudiences(o.db, client.id) : [];
  for (const n of needAud) { const a = pick(n, all); if (!a) throw new Error(`No Klaviyo list or segment matches "${n}". Use find_audiences for the exact name.`); audiences.set(n, a.id); }
  let trigger: any;
  if (plan.trigger.list || plan.trigger.segment) {
    const n = (plan.trigger.list ?? plan.trigger.segment)!, a = all.find((x) => x.id === audiences.get(n))!;
    trigger = { type: a.type, id: a.id };
  } else if (plan.trigger.metric) {
    const metrics = (await klaviyoAll<any>(key, "/metrics/?fields[metric]=name")).data;
    const want = plan.trigger.metric.toLowerCase();
    const m = metrics.find((x) => x.attributes.name.toLowerCase() === want) ?? metrics.find((x) => x.attributes.name.toLowerCase().includes(want));
    if (!m) throw new Error(`No Klaviyo metric called "${plan.trigger.metric}". Metrics in this account include: ${metrics.slice(0, 15).map((x) => x.attributes.name).join(", ")}`);
    trigger = { type: "metric", id: m.id };
  } else throw new Error("The plan needs a trigger: list, segment or metric");

  // Default sender from the account (the copy's From label wins for the name).
  const acct = (await klaviyo<any>(key, "/accounts/")).data?.[0]?.attributes?.contact_information ?? {};
  const from = { email: acct.default_sender_email ?? "", label: acct.default_sender_name ?? client.name };
  if (!from.email) throw new Error("Klaviyo has no default sender email for this account; set one in Klaviyo (Settings → Email) first.");

  const ctx: Ctx = { templates, audiences, from, n: 0 };
  const actions: any[] = [];
  const entry = compile(plan.steps, ctx, actions);
  let profile_filter: any = null;
  if (plan.exit_if_ordered) {
    const placed = await metricByName(key, "Placed Order");
    if (placed) profile_filter = { condition_groups: [{ conditions: [{ type: "profile-metric", metric_id: placed.id, measurement: "count", measurement_filter: { type: "numeric", operator: "equals", value: 0 }, timeframe_filter: { type: "date", operator: "flow-start" } }] }] };
    else manual.push('Add the flow filter "Placed Order zero times since starting this flow" (no Placed Order metric found).');
  }
  const name = `FC | ${plan.name} (draft)${o.freshCopy ? ` ${new Date().toISOString().slice(0, 10)}` : ""}`;
  const body = (pf: any) => ({ data: { type: "flow", attributes: { name, definition: { triggers: [trigger], profile_filter: pf, entry_action_id: entry, actions } } } });
  const problem = flowBodyProblem(body(profile_filter));
  if (problem) throw new Error(`Flow refused before sending: ${problem}`);

  const w = await draftWriter(o.db, client.id);
  let res: any;
  try { res = await w.post("/flows?additional-fields[flow]=definition", body(profile_filter), name, FLOW_REVISION); }
  catch (e: any) {
    if (/403|scope|permission/i.test(e.message)) throw new Error(`Klaviyo refused (${e.message}). The client's Klaviyo API key needs the "Flows: Full access" (flows:write) scope: edit the key in Klaviyo → Settings → API keys, or create a new one and reconnect it.`);
    if (!profile_filter) throw e;
    // The exit filter is the least certain part of the request: build without it and say what to add by hand.
    log(`flow filter refused (${e.message}); building without it`);
    res = await w.post("/flows?additional-fields[flow]=definition", body(null), name, FLOW_REVISION);
    manual.push('Add the flow filter "Placed Order zero times since starting this flow" in Klaviyo (the API refused it).');
  }
  const flowId = res.data.id as string;

  // Read it back: the flow and every message must be drafts.
  const check = await fetch(`https://a.klaviyo.com/api/flows/${flowId}?additional-fields[flow]=definition`, { headers: { Authorization: `Klaviyo-API-Key ${key}`, revision: FLOW_REVISION, accept: "application/vnd.api+json" } }).then((r) => r.json()).catch(() => null);
  const status = String(check?.data?.attributes?.status ?? res.data.attributes?.status ?? "unknown");
  const liveActions = (check?.data?.attributes?.definition?.actions ?? []).filter((a: any) => a.data?.status && a.data.status !== "draft");
  const verified = /draft/i.test(status) && !liveActions.length;
  if (!verified) warnings.push(`CHECK IN KLAVIYO NOW: the new flow reads back as status "${status}"${liveActions.length ? ` with ${liveActions.length} message(s) not in draft` : ""}. Fluid only creates drafts; set it to Draft if it isn't.`);
  if (plan.steps.some((s) => s.split)) manual.push("Splits use profile properties: they only route people once those properties exist on profiles (e.g. after the new pop-up is live).");

  const url = `https://www.klaviyo.com/flow/${flowId}/edit`;
  mkdirSync(join(clientDir, "flows"), { recursive: true });
  writeFileSync(statePath, JSON.stringify({ flow_id: flowId, flow_name: name, url, status, built_at: new Date().toISOString(), templates: Object.fromEntries([...templates].map(([k, v]) => [k, v.template_id])), manual_steps: manual }, null, 2));
  return { created: true, flow_id: flowId, flow_name: name, url, status, emails: emails.length, sms, splits, verified_draft: verified, manual_steps: manual, warnings };
}
