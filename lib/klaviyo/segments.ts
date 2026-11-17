// Fluid's standard onboarding segment pack for Klaviyo. Built from the account's own metrics (resolved by name)
// and tuned per client by its order data (reorder gap, VIP spend). Names start with "FC | " so they're easy to
// find and never collide with the client's own segments. Created through lib/klaviyo/write.ts (no sending).
//
// Klaviyo logic: condition groups are ANDed; conditions inside one group are ORed.

type Tf = Record<string, unknown>;
const inLast = (days: number): Tf => ({ type: "date", operator: "in-the-last", unit: "day", quantity: days });
const allTime: Tf = { type: "date", operator: "alltime" };
const between = (fromDaysAgo: number, toDaysAgo: number): Tf => ({ type: "date", operator: "between", start: fromDaysAgo, end: toDaysAgo, unit: "day" });
const m = (metric_id: string, operator: string, value: number, timeframe_filter: Tf, measurement: "count" | "sum" = "count") =>
  ({ type: "profile-metric", metric_id, measurement, measurement_filter: { type: "numeric", operator, value }, timeframe_filter });
const emailSubscribed = { type: "profile-marketing-consent", consent: { channel: "email", can_receive_marketing: true, consent_status: { subscription: "subscribed" } } };
const smsSubscribed = { type: "profile-marketing-consent", consent: { channel: "sms", can_receive_marketing: true, consent_status: { subscription: "subscribed" } } };
const groups = (...gs: unknown[][]) => ({ condition_groups: gs.map((conditions) => ({ conditions })) });

// Name variants by integration (Shopify's checkout metric is "Checkout Started"; older accounts use "Started Checkout").
export const METRICS = { opened: ["Opened Email"], clicked: ["Clicked Email"], active: ["Active on Site"], placed: ["Placed Order"], checkout: ["Started Checkout", "Checkout Started"], viewed: ["Viewed Product"] } as const;
export type MetricIds = Partial<Record<keyof typeof METRICS, string>>;
export type SegmentSpec = { name: string; purpose: string; needs: (keyof typeof METRICS)[]; definition: (ids: Required<MetricIds>) => unknown };

export function segmentPack(opts: { reorderGapDays?: number; vipSpend?: number } = {}): SegmentSpec[] {
  const gap = Math.max(20, Math.round(opts.reorderGapDays ?? 45));
  const lapse = Math.max(120, gap * 2);
  const vip = Math.round(opts.vipSpend ?? 500);
  const engaged = (d: number): SegmentSpec => ({
    name: `FC | Engaged ${d}d`,
    purpose: `Subscribed and opened, clicked, visited the site or bought in the last ${d} days. The default campaign audience${d === 90 ? " (core sends)" : ""}.`,
    needs: ["opened", "clicked", "active", "placed"],
    definition: (i) => groups([emailSubscribed], [m(i.opened, "greater-than-or-equal", 1, inLast(d)), m(i.clicked, "greater-than-or-equal", 1, inLast(d)), m(i.active, "greater-than-or-equal", 1, inLast(d)), m(i.placed, "greater-than-or-equal", 1, inLast(d))]),
  });
  return [
    engaged(30), engaged(60), engaged(90), engaged(180),
    { name: "FC | Unengaged 90d", purpose: "Subscribed but no open, click, visit or order in 90 days. Sunset flow, and excluded from campaigns.", needs: ["opened", "clicked", "active", "placed"],
      definition: (i) => groups([emailSubscribed], [m(i.opened, "equals", 0, inLast(90))], [m(i.clicked, "equals", 0, inLast(90))], [m(i.active, "equals", 0, inLast(90))], [m(i.placed, "equals", 0, inLast(90))]) },
    { name: "FC | Purchasers", purpose: "Everyone who has ordered at least once.", needs: ["placed"], definition: (i) => groups([m(i.placed, "greater-than-or-equal", 1, allTime)]) },
    { name: "FC | Never purchased", purpose: "Subscribers who haven't bought yet. First-purchase offers and welcome-style campaigns.", needs: ["placed"], definition: (i) => groups([emailSubscribed], [m(i.placed, "equals", 0, allTime)]) },
    { name: "FC | Repeat purchasers", purpose: "Two or more orders. Loyalty, new launches, early access.", needs: ["placed"], definition: (i) => groups([m(i.placed, "greater-than-or-equal", 2, allTime)]) },
    { name: "FC | One-time buyers 30-60d", purpose: "Bought once, 30–60 days ago. The second-purchase window.", needs: ["placed"], definition: (i) => groups([m(i.placed, "equals", 1, allTime)], [m(i.placed, "greater-than-or-equal", 1, between(30, 60))]) },
    { name: `FC | Due to reorder (${gap}-${gap * 2}d)`, purpose: `Repeat buyers whose last order was ${gap}–${gap * 2} days ago (their typical reorder gap is ${gap} days).`, needs: ["placed"],
      definition: (i) => groups([m(i.placed, "greater-than-or-equal", 2, allTime)], [m(i.placed, "equals", 0, inLast(gap))], [m(i.placed, "greater-than-or-equal", 1, inLast(gap * 2))]) },
    { name: `FC | Lapsed customers ${lapse}d+`, purpose: `Bought before, nothing in ${lapse}+ days. Winback.`, needs: ["placed"], definition: (i) => groups([m(i.placed, "greater-than-or-equal", 1, allTime)], [m(i.placed, "equals", 0, inLast(lapse))]) },
    { name: `FC | VIP ($${vip}+ in 365d)`, purpose: `Top spenders: $${vip}+ in the last year. Early access; no discount needed.`, needs: ["placed"], definition: (i) => groups([m(i.placed, "greater-than-or-equal", vip, inLast(365), "sum")]) },
    { name: "FC | Recent purchasers 14d", purpose: "Ordered in the last 14 days. Exclude from sale and offer sends.", needs: ["placed"], definition: (i) => groups([m(i.placed, "greater-than-or-equal", 1, inLast(14))]) },
    { name: "FC | Checkout abandoners 30d", purpose: "Started checkout in the last 30 days without ordering.", needs: ["checkout", "placed"], definition: (i) => groups([m(i.checkout, "greater-than-or-equal", 1, inLast(30))], [m(i.placed, "equals", 0, inLast(30))]) },
    { name: "FC | Browse abandoners 30d", purpose: "Viewed a product in the last 30 days without ordering.", needs: ["viewed", "placed"], definition: (i) => groups([m(i.viewed, "greater-than-or-equal", 1, inLast(30))], [m(i.placed, "equals", 0, inLast(30))]) },
    { name: "FC | SMS subscribers", purpose: "Can receive SMS marketing.", needs: [], definition: () => groups([smsSubscribed]) },
  ];
}
