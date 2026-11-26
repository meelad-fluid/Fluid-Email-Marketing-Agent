// Picking the right metric when an account has several with the same name. Reconnecting Shopify (or a
// second store/integration) leaves a duplicate "Placed Order" etc. that has no events; taking the first
// match then breaks reporting ("conversion metric does not support querying for values data"), order
// pulls ("no orders") and segments built on it. With more than one match, use the one with the most events
// in the last 90 days; ties go to Shopify, then the oldest (the original integration).
import { klaviyo, klaviyoAll } from "./api";

async function eventCount(key: string, metricId: string): Promise<number> {
  const end = new Date(), start = new Date(end.getTime() - 90 * 864e5);
  try {
    const r: any = await klaviyo(key, "/metric-aggregates/", { method: "POST", body: { data: { type: "metric-aggregate", attributes: {
      metric_id: metricId, measurements: ["count"], interval: "month", timezone: "UTC",
      filter: [`greater-or-equal(datetime,${start.toISOString().slice(0, 19)})`, `less-than(datetime,${end.toISOString().slice(0, 19)})`] } } } });
    return (r.data?.attributes?.data?.[0]?.measurements?.count ?? []).reduce((a: number, b: number) => a + b, 0);
  } catch { return -1; }
}

/** The live metric among same-named candidates (undefined if none). */
export async function pickActiveMetric(key: string, candidates: any[]): Promise<any | undefined> {
  if (candidates.length <= 1) return candidates[0];
  const counts = new Map<string, number>();
  for (const m of candidates) counts.set(m.id, await eventCount(key, m.id)); // one at a time: metric-aggregates is rate limited
  const shopify = (m: any) => (/shopify/i.test(m.attributes.integration?.name ?? "") ? 1 : 0);
  return [...candidates].sort((a, b) => counts.get(b.id)! - counts.get(a.id)! || shopify(b) - shopify(a) || Date.parse(a.attributes.created ?? "") - Date.parse(b.attributes.created ?? ""))[0];
}

/** The account's live metric with this exact name. */
export async function metricByName(key: string, name: string, metrics?: any[]): Promise<any | undefined> {
  const all = metrics ?? (await klaviyoAll<any>(key, "/metrics/")).data;
  return pickActiveMetric(key, all.filter((m) => m.attributes.name === name));
}
