// Read-only order analysis from Klaviyo's Shopify "Placed Order" events (no Shopify access needed).
// Same outputs as shopify-audit.ts: best sellers (90d) + first-order products, AOV spread, repeat rate and
// days to 2nd order, first → next product paths, cohorts with sizes, discount-code usage.
// Usage: KLAVIYO_AUDIT_KEY=pk_... npx tsx scripts/klaviyo-orders-audit.ts <slug> [days=365]
import { mkdirSync, writeFileSync } from "node:fs";
import { klaviyo, klaviyoAll } from "../lib/klaviyo/api";

const key = process.env.KLAVIYO_AUDIT_KEY!, slug = process.argv[2], DAYS = Number(process.argv[3] ?? 365);
if (!key || !slug) throw new Error("Usage: KLAVIYO_AUDIT_KEY=pk_... npx tsx scripts/klaviyo-orders-audit.ts <slug> [days]");
const day = 864e5, now = Date.now();
type Item = { name: string; qty: number; price: number; cats: string[] };
type Order = { at: number; value: number; who: string; items: Item[]; codes: string[] };

async function main() {
  const metrics = (await klaviyoAll<any>(key, "/metrics/")).data;
  const placed = metrics.find((m) => m.attributes.name === "Placed Order" && m.attributes.integration?.name === "Shopify");
  if (!placed) throw new Error("No Shopify Placed Order metric in Klaviyo — start from scratch");
  const since = new Date(now - DAYS * day).toISOString().slice(0, 19);
  const orders: Order[] = [];
  let url: string | null = `/events/?filter=and(equals(metric_id,"${placed.id}"),greater-or-equal(datetime,${since}))&fields[event]=datetime,event_properties&include=profile&fields[profile]=id&page[size]=200&sort=datetime`;
  let pages = 0;
  while (url) {
    const r: any = await klaviyo<any>(key, url);
    for (const e of r.data) {
      const p = e.attributes.event_properties ?? {};
      const lines: any[] = p.$extra?.line_items ?? [];
      const items: Item[] = lines.length
        ? lines.map((l: any) => ({ name: String(l.product?.title ?? l.title ?? l.name ?? "?").trim(), qty: Number(l.quantity ?? 1), price: Number(l.price ?? 0), cats: p.Collections ?? [] }))
        : (p.Items ?? []).map((i: any) => (typeof i === "string" ? { name: i.trim(), qty: 1, price: 0, cats: [] } : { name: String(i.ProductName ?? i.Name ?? "?").trim(), qty: Number(i.Quantity ?? 1), price: Number(i.ItemPrice ?? 0), cats: i.Categories ?? [] }));
      if (Number(p.$value ?? 0) <= 0) continue; // $0 orders: samples, TikTok Shop sample orders, reshipments
      orders.push({ at: Date.parse(e.attributes.datetime), value: Number(p.$value ?? 0), who: e.relationships?.profile?.data?.id ?? "?", items, codes: p["Discount Codes"] ?? [] });
    }
    url = r.links?.next ?? null;
    if (++pages % 25 === 0) process.stdout.write(`${orders.length} orders… `);
  }
  if (!orders.length) throw new Error("No orders in Klaviyo for this window — start from scratch");

  const byCust = new Map<string, Order[]>();
  for (const o of orders) (byCust.get(o.who) ?? byCust.set(o.who, []).get(o.who)!).push(o);
  // A customer's first order in the window counts as a first order only if the window starts well before it
  // (60-day buffer) — older customers' history before the window is unknown.
  const buffer = now - (DAYS - 60) * day;
  const isFirst = new Set<Order>();
  for (const os of byCust.values()) { os.sort((a, b) => a.at - b.at); if (os[0].at >= buffer) isFirst.add(os[0]); }

  const in90 = orders.filter((o) => now - o.at <= 90 * day);
  const prod = new Map<string, { units: number; revenue: number; orders: number; firstOrders: number }>();
  for (const o of in90) for (const it of o.items) {
    const p = prod.get(it.name) ?? prod.set(it.name, { units: 0, revenue: 0, orders: 0, firstOrders: 0 }).get(it.name)!;
    p.units += it.qty; p.revenue += it.price * it.qty; p.orders++; if (isFirst.has(o)) p.firstOrders++;
  }
  const round = (n: number) => Math.round(n);
  const best = [...prod.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 15).map(([name, p]) => ({ name, ...p, revenue: round(p.revenue) }));
  const bestFirst = [...prod.entries()].sort((a, b) => b[1].firstOrders - a[1].firstOrders).slice(0, 10).map(([name, p]) => ({ name, firstOrders: p.firstOrders }));
  const vals = in90.map((o) => o.value).sort((a, b) => a - b);
  const pct = (xs: number[], q: number) => (xs.length ? +xs[Math.min(xs.length - 1, Math.floor(q * xs.length))].toFixed(2) : null);
  const b2bCut = 1000; // orders this large are almost always business buyers

  const firsts = [...byCust.values()].filter((os) => isFirst.has(os[0]) && os[0].at <= now - 60 * day); // gave them 60+ days to return
  const back = firsts.filter((os) => os.length > 1);
  const gaps = back.map((os) => round((os[1].at - os[0].at) / day)).sort((a, b) => a - b);
  const paths = new Map<string, number>();
  for (const os of [...byCust.values()].filter((x) => x.length > 1 && isFirst.has(x[0]))) {
    const a = os[0].items[0]?.name, nb = os[1].items.find((i) => !os[0].items.some((x) => x.name === i.name))?.name ?? `${os[1].items[0]?.name} (same)`;
    if (a) paths.set(`${a} → ${nb}`, (paths.get(`${a} → ${nb}`) ?? 0) + 1);
  }
  const sameAgain = back.filter((os) => os[1].items.some((i) => os[0].items.some((x) => x.name === i.name))).length;

  const cust = [...byCust.values()].map((os) => ({ last: os[os.length - 1].at, n: os.length, spend: os.reduce((t, o) => t + o.value, 0), b2b: os.some((o) => o.value >= b2bCut), names: new Set(os.flatMap((o) => o.items.map((i) => i.name))) }));
  const ago = (c: { last: number }) => (now - c.last) / day;
  const reorder = pct(gaps, 0.5) ?? 45;
  const spends = cust.map((c) => c.spend).sort((a, b) => b - a), vipCut = spends[Math.floor(spends.length * 0.1)] ?? 0;
  const has = (c: any, re: RegExp) => [...c.names].some((n: string) => re.test(n));
  const groups: Record<string, RegExp> = { coffee: /coffee/i, matcha: /matcha/i, cacao: /cacao|cocoa/i, mushroom: /mushroom|lion|reishi|chaga|cordyceps|myco|turkey tail/i, vanilla: /vanilla/i };
  const crossSell: Record<string, number> = {};
  for (const [a, ra] of Object.entries(groups)) for (const [b, rb] of Object.entries(groups)) if (a !== b) { const n = cust.filter((c) => !c.b2b && ago(c) <= 365 && has(c, ra) && !has(c, rb)).length; if (n > 50) crossSell[`bought ${a}, never ${b}`] = n; }
  const codes = new Map<string, { orders: number; revenue: number }>();
  for (const o of in90) for (const c of o.codes) { const x = codes.get(c) ?? codes.set(c, { orders: 0, revenue: 0 }).get(c)!; x.orders++; x.revenue += o.value; }

  const out = {
    pulled_at: new Date().toISOString(), source: "Klaviyo Shopify Placed Order events", window_days: DAYS, orders: orders.length, customers: byCust.size,
    last_90d: { orders: in90.length, revenue: round(in90.reduce((t, o) => t + o.value, 0)), aov: +(vals.reduce((t, v) => t + v, 0) / (vals.length || 1)).toFixed(2), order_value_p25_p50_p75_p90: [0.25, 0.5, 0.75, 0.9].map((q) => pct(vals, q)), share_orders_over_160: +(vals.filter((v) => v >= 160).length / (vals.length || 1)).toFixed(3), b2b_sized_orders_1000_plus: in90.filter((o) => o.value >= b2bCut).length, best_sellers: best, best_first_order_products: bestFirst, discount_codes: [...codes.entries()].sort((a, b) => b[1].orders - a[1].orders).slice(0, 10).map(([c, x]) => ({ code: c, orders: x.orders, revenue: round(x.revenue) })) },
    repeat: { first_time_buyers_60d_plus_ago: firsts.length, came_back: back.length, repeat_rate: firsts.length ? +(back.length / firsts.length).toFixed(3) : null, reordered_same_product: back.length ? +(sameAgain / back.length).toFixed(3) : null, days_to_2nd_order_p25_p50_p75: [pct(gaps, 0.25), pct(gaps, 0.5), pct(gaps, 0.75)], top_paths: [...paths.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10) },
    cohorts: {
      one_time_30_60d: cust.filter((c) => c.n === 1 && !c.b2b && ago(c) >= 30 && ago(c) <= 60).length,
      one_time_60_120d: cust.filter((c) => c.n === 1 && !c.b2b && ago(c) > 60 && ago(c) <= 120).length,
      due_to_reorder: cust.filter((c) => c.n >= 2 && !c.b2b && ago(c) >= reorder && ago(c) <= reorder * 2).length,
      lapsed_repeat_buyers: cust.filter((c) => c.n >= 2 && !c.b2b && ago(c) > reorder * 2).length,
      vip_top10pct: { customers: cust.filter((c) => c.spend >= vipCut).length, min_spend: round(vipCut) },
      b2b_sized_buyers: cust.filter((c) => c.b2b).length,
      cross_sell: crossSell,
    },
  };
  const dir = `clients/${slug}/research`; mkdirSync(dir, { recursive: true });
  const file = `${dir}/klaviyo-orders-${out.pulled_at.slice(0, 10)}.json`;
  writeFileSync(file, JSON.stringify(out, null, 1));
  console.log(`\n${orders.length} orders, ${byCust.size} customers over ${DAYS} days · saved ${file}`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
