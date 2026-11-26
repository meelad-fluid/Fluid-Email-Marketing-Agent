// Fluid's segmentation master sheet (knowledge/sops/segmentation-master.md), as Klaviyo segment definitions.
// Built from the account's own metrics (resolved by name). Names start with "FC | ".
// Klaviyo logic: condition groups are ANDed; conditions inside one group are ORed.

type Tf = Record<string, unknown>;
const inLast = (days: number): Tf => ({ type: "date", operator: "in-the-last", unit: "day", quantity: days });
const allTime: Tf = { type: "date", operator: "alltime" };
const m = (metric_id: string, operator: string, value: number, timeframe_filter: Tf) =>
  ({ type: "profile-metric", metric_id, measurement: "count", measurement_filter: { type: "numeric", operator, value }, timeframe_filter });
const atLeastOnce = (id: string, days: number) => m(id, "greater-than-or-equal", 1, inLast(days));
// "Person can receive email marketing" (also covers "not suppressed for email").
const canReceiveEmail = { type: "profile-marketing-consent", consent: { channel: "email", can_receive_marketing: true, consent_status: { subscription: "any" } } };
const createdInLast = (days: number) => ({ type: "profile-property", property: "created", filter: { type: "date", operator: "in-the-last", unit: "day", quantity: days } });
const groups = (...gs: unknown[][]) => ({ condition_groups: gs.map((conditions) => ({ conditions })) });

// Name variants by integration (Shopify's checkout metric is "Checkout Started"; older accounts use "Started Checkout").
export const METRICS = {
  opened: ["Opened Email"], clicked: ["Clicked Email"], active: ["Active on Site"], placed: ["Placed Order"],
  checkout: ["Checkout Started", "Started Checkout"], cart: ["Added to Cart"], viewed: ["Viewed Product"],
} as const;
export type MetricKey = keyof typeof METRICS;
export type MetricIds = Partial<Record<MetricKey, string>>;
export type SegmentSpec = { name: string; purpose: string; needs: MetricKey[]; definition: (ids: Required<MetricIds>) => unknown };

export function engaged(days: number): SegmentSpec {
  return {
    name: `FC | Engaged ${days}`,
    purpose: `Opened, clicked, started checkout, ordered, was active on site or added to cart in the last ${days} days, and can receive email marketing.`,
    needs: ["opened", "clicked", "checkout", "placed", "active", "cart"],
    definition: (i) => groups(
      [atLeastOnce(i.opened, days), atLeastOnce(i.clicked, days), atLeastOnce(i.checkout, days), atLeastOnce(i.placed, days), atLeastOnce(i.active, days), atLeastOnce(i.cart, days)],
      [canReceiveEmail],
    ),
  };
}
export function newSubs(): SegmentSpec {
  return {
    name: "FC | Engaged 30 ex. Purchasers (New Subs)",
    purpose: "Created in the last 30 days, opened/clicked/viewed a product in the last 30 days, no order in the last 30 days, can receive email marketing.",
    needs: ["opened", "clicked", "viewed", "placed"],
    definition: (i) => groups(
      [atLeastOnce(i.opened, 30), atLeastOnce(i.clicked, 30), atLeastOnce(i.viewed, 30)],
      [createdInLast(30)],
      [m(i.placed, "equals", 0, inLast(30))],
      [canReceiveEmail],
    ),
  };
}
export function placedOrder(days: number): SegmentSpec {
  return { name: `FC | Placed Order ${days}d`, purpose: `Placed an order at least once in the last ${days} days.`, needs: ["placed"], definition: (i) => groups([atLeastOnce(i.placed, days)]) };
}
export function lapsed(days = 180): SegmentSpec {
  return {
    name: days === 180 ? "FC | Lapsed Customers (Winback)" : `FC | Lapsed Customers ${days}d`,
    purpose: `Ordered before, no order in the last ${days} days, and not suppressed for email.`,
    needs: ["placed"],
    definition: (i) => groups([m(i.placed, "greater-than-or-equal", 1, allTime)], [m(i.placed, "equals", 0, inLast(days))], [canReceiveEmail]),
  };
}

/** The onboarding set from the master sheet. */
export function segmentPack(): SegmentSpec[] {
  return [engaged(90), engaged(120), engaged(180), newSubs(), placedOrder(7), placedOrder(14), placedOrder(30), lapsed(180)];
}

/** Turn a request like "engaged 120", "placed order last 14 days", "new subs", "winback" into a master-sheet segment. */
export function segmentForRequest(text: string): SegmentSpec | null {
  const t = text.toLowerCase();
  const n = Number(t.match(/(\d{1,3})/)?.[1]);
  if (/new sub|ex\.? purchas|non.?purchas.*30/.test(t)) return newSubs();
  if (/lapsed|winback|win-back/.test(t)) return lapsed(n && n >= 60 ? n : 180);
  if (/placed|purchas|order|bought|buyer/.test(t) && n) return placedOrder(n);
  if (/engag/.test(t) && n) return engaged(n);
  return null;
}

export function resolveMetricIds(metrics: any[]): MetricIds {
  const ids: MetricIds = {};
  for (const [k, names] of Object.entries(METRICS)) {
    const hits = metrics.filter((x) => (names as readonly string[]).includes(x.attributes.name));
    ids[k as MetricKey] = (hits.find((x) => /shopify/i.test(x.attributes.integration?.name ?? "")) ?? hits.find((x) => x.attributes.integration?.category !== "API") ?? hits[0])?.id;
  }
  return ids;
}

/** Like resolveMetricIds, but when a name matches several metrics it picks the one that has events. */
export async function resolveLiveMetricIds(key: string, metrics: any[]): Promise<MetricIds> {
  const { pickActiveMetric } = await import("./metrics");
  const ids = resolveMetricIds(metrics);
  for (const [k, names] of Object.entries(METRICS)) {
    const hits = metrics.filter((x) => (names as readonly string[]).includes(x.attributes.name));
    if (hits.length > 1) ids[k as MetricKey] = (await pickActiveMetric(key, hits))?.id;
  }
  return ids;
}
