import { z } from "zod";

// A flow framework is a brand-neutral Fluid flow (welcome, abandoned checkout...) stored in
// the brain and applied to each new client at onboarding.
//
// Its shape mirrors Klaviyo's flow definition (trigger, profile filter, actions linked by
// next / next_if_true / next_if_false) so Fluid's real flows can be imported from Klaviyo and
// built into a new client's account with minimal translation. Anything client-specific
// (list ids, discount codes, product links) is a {{variable}} filled from the client profile.

// Readable rule for humans + the exact Klaviyo filter JSON when we have it (from an import).
const Condition = z.object({
  description: z.string(), // e.g. "Has not placed an order since starting this flow"
  klaviyo: z.unknown().optional(),
});

const Trigger = z.object({
  type: z.enum(["list", "segment", "metric", "price-drop", "date", "low-inventory", "back-in-stock"]),
  // list/segment: a variable like "{{lists.newsletter}}"; metric: "Started Checkout", "Placed Order"...
  source: z.string(),
  filters: z.array(Condition).default([]), // trigger (event) filters, e.g. "Value ≥ $50"
});

const Base = {
  id: z.string(),
  label: z.string().optional(),
};

const Next = z.string().nullable(); // null = end of the branch

export const ActionSchema = z.discriminatedUnion("type", [
  z.object({
    ...Base,
    type: z.literal("time-delay"),
    delay: z.object({
      value: z.number().positive(),
      unit: z.enum(["minutes", "hours", "days", "weeks"]),
      // When the client's data sets this delay (e.g. the winback day), the variable that holds it; value is the default.
      variable: z.string().optional(),
    }),
    // Optional send window, e.g. only send 9am–8pm in the profile's timezone
    window: z.object({ fromHour: z.number(), toHour: z.number(), days: z.array(z.string()).optional() }).optional(),
    next: Next,
  }),
  z.object({
    ...Base,
    type: z.literal("send-email"),
    // The email's job in the flow, and which brain email template it renders from.
    job: z.string(),
    template: z.string(), // key into brain email_templates, e.g. "welcome-1-offer"
    subject: z.array(z.string()).min(1), // options; {{variables}} allowed
    preview: z.string().optional(),
    smartSending: z.boolean().default(false),
    // Klaviyo dynamic block filled from the trigger event (abandoned cart vs checkout differ only here).
    dynamicBlock: z.enum(["cart-items", "checkout-items", "viewed-product"]).optional(),
    resendOf: z.string().optional(), // id of the email this re-sends to people who didn't open it
    // The brief Fluid's strategy docs give each email (Email Topic / Design / Sending to / Goals).
    name: z.string().optional(), // "Email #3: Mystery Discount"
    topic: z.string().optional(), // the Email Topic line
    format: z.enum(["designed", "plain_text"]).optional(), // missing = designed
    sendingTo: z.string().optional(),
    offer: z.string().optional(), // which rung of the offer ladder, e.g. "W + 5 points, 24 hours"
    structure: z.string().optional(), // fixed layout when Fluid prescribes one
    // Goals in the order the email covers them. Replenishable and one-off brands share the
    // structure; only these differ. `all` applies to both.
    goals: z.object({ all: z.array(z.string()).default([]), replenishable: z.array(z.string()).default([]), one_off: z.array(z.string()).default([]) }).optional(),
    sameAs: z.string().optional(), // id of the email whose content this one repeats (welcome tracks after the split)
    next: Next,
  }),
  z.object({
    ...Base,
    type: z.literal("send-sms"),
    job: z.string(),
    body: z.string(),
    sameAs: z.string().optional(),
    next: Next,
  }),
  z.object({
    ...Base,
    type: z.enum(["conditional-split", "trigger-split"]),
    condition: Condition,
    next_if_true: Next,
    next_if_false: Next,
  }),
  z.object({
    ...Base,
    type: z.literal("ab-test"),
    hypothesis: z.string(),
    variants: z.array(z.object({ label: z.string(), weight: z.number(), next: Next })).min(2),
  }),
  z.object({
    ...Base,
    type: z.literal("update-profile"),
    property: z.string(),
    value: z.string(),
    next: Next,
  }),
]);

export const FlowFrameworkSchema = z.object({
  key: z.string(), // "welcome-series"
  name: z.string(),
  version: z.number().int().positive(),
  status: z.enum(["draft", "active", "retired"]).default("draft"),
  purpose: z.string(),
  // Where this framework came from: imported from a Klaviyo flow, or written by Fluid.
  source: z.object({ kind: z.enum(["klaviyo-import", "fluid-written"]), note: z.string().optional() }),
  tier: z.enum(["core", "optional"]).optional(), // core = the six flows every client gets
  appliesTo: z.array(z.enum(["replenishable", "one_off"])).optional(), // missing = both
  trigger: Trigger,
  profileFilter: z.array(Condition).default([]), // flow filters (all must be true), re-checked before every step
  // null = a profile can only ever enter once. Otherwise the minimum gap between entries.
  reentry: z.object({ value: z.number().positive(), unit: z.enum(["hours", "days"]) }).nullable(),
  entry: z.string(), // id of the first action
  actions: z.array(ActionSchema).min(1),
  // What each client must supply before this flow can be built for them.
  variables: z.array(z.object({ key: z.string(), description: z.string(), example: z.string().optional() })).default([]),
  benchmarks: z.record(z.string(), z.string()).default({}), // e.g. { "RPR": "$2.50+", "placed order rate": "3%+" }
  notes: z.string().optional(),
});

export type FlowFramework = z.infer<typeof FlowFrameworkSchema>;
export type FlowAction = z.infer<typeof ActionSchema>;

// Structural checks Zod can't express: every link points at a real action, every action is
// reachable from the entry, and there are no loops.
export function validateFramework(f: FlowFramework): string[] {
  const errors: string[] = [];
  const ids = new Set(f.actions.map((a) => a.id));
  if (ids.size !== f.actions.length) errors.push("Duplicate action ids");
  const links = (a: FlowAction): (string | null)[] =>
    "next" in a ? [a.next] : "next_if_true" in a ? [a.next_if_true, a.next_if_false] : a.type === "ab-test" ? a.variants.map((v) => v.next) : [];
  for (const a of f.actions) for (const l of links(a)) if (l && !ids.has(l)) errors.push(`${a.id} links to missing action "${l}"`);
  if (!ids.has(f.entry)) errors.push(`Entry "${f.entry}" is not an action`);

  const byId = new Map(f.actions.map((a) => [a.id, a]));
  const seen = new Set<string>();
  const walk = (id: string | null, path: Set<string>) => {
    if (!id || !byId.has(id)) return;
    if (path.has(id)) return void errors.push(`Loop through "${id}"`);
    seen.add(id);
    for (const l of links(byId.get(id)!)) walk(l, new Set([...path, id]));
  };
  walk(f.entry, new Set());
  for (const id of ids) if (!seen.has(id)) errors.push(`"${id}" can't be reached from the entry`);

  const used = new Set(JSON.stringify(f.actions).match(/{{\s*[\w.]+\s*}}/g)?.map((v) => v.replace(/[{}\s]/g, "")) ?? []);
  const declared = new Set(f.variables.map((v) => v.key));
  // brand.* comes from the brand kit; event./person./organization. and a few bare names are Klaviyo's own template tags.
  const klaviyoTag = (v: string) => /^(event|person|organization)\./.test(v) || ["first_name", "last_name", "email", "checkout_url"].includes(v);
  for (const v of used) if (!declared.has(v) && !v.startsWith("brand.") && !klaviyoTag(v)) errors.push(`Variable "{{${v}}}" is used but not declared`);
  return errors;
}
