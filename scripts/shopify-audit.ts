// Read-only Shopify audit for onboarding (fluid-client-onboarding, references/shopify-audit.md).
// Pulls 365 days of orders and works out: best sellers (90d) split by first vs repeat orders, AOV,
// repeat rate and days to 2nd order, first-product → next-product paths, and the email cohorts with sizes.
// Credentials come from the environment only and are never written anywhere.
// Usage: SHOPIFY_SHOP=x.myshopify.com SHOPIFY_CLIENT_ID=… SHOPIFY_CLIENT_SECRET=shpss_… npx tsx scripts/shopify-audit.ts <slug>
//    or: SHOPIFY_SHOP=… SHOPIFY_ACCESS_TOKEN=shpat_… npx tsx scripts/shopify-audit.ts <slug>
import { mkdirSync, writeFileSync } from "node:fs";

const { SHOPIFY_SHOP: shop, SHOPIFY_CLIENT_ID: id, SHOPIFY_CLIENT_SECRET: secret } = process.env;
const slug = process.argv[2];
if (!shop || !slug || !(process.env.SHOPIFY_ACCESS_TOKEN || (id && secret))) throw new Error("Usage: see header");
const API = "2025-10";

async function token() {
  if (process.env.SHOPIFY_ACCESS_TOKEN) return process.env.SHOPIFY_ACCESS_TOKEN;
  const r = await fetch(`https://${shop}/admin/oauth/access_token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "client_credentials", client_id: id!, client_secret: secret! }) });
  if (!r.ok) throw new Error(`Shopify token ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).access_token as string;
}

async function gql(tk: string, query: string, variables: Record<string, unknown> = {}) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`https://${shop}/admin/api/${API}/graphql.json`, { method: "POST", headers: { "content-type": "application/json", "X-Shopify-Access-Token": tk }, body: JSON.stringify({ query, variables }) });
    const j = await r.json();
    if (j.errors?.some?.((e: any) => e.extensions?.code === "THROTTLED") && attempt < 8) { await new Promise((s) => setTimeout(s, 2000)); continue; }
    if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 300));
    return j.data;
  }
}

const Q = `query($cursor:String,$q:String){ orders(first:200, after:$cursor, query:$q, sortKey:CREATED_AT){ pageInfo{hasNextPage endCursor}
  nodes{ id createdAt cancelledAt test totalPriceSet{shopMoney{amount}} customer{ id numberOfOrders tags }
    lineItems(first:40){ nodes{ title quantity product{ id title productType } originalTotalSet{shopMoney{amount}} } } } } }`;

type Order = { id: string; at: Date; total: number; cust?: string; lifetime?: number; tags: string[]; items: { pid: string; title: string; type: string; qty: number; rev: number }[] };
const day = 864e5;

async function main() {
  const tk = await token();
  const shopInfo = (await gql(tk, `{ shop { name currencyCode ianaTimezone } }`)).shop;
  const since = new Date(Date.now() - 365 * day).toISOString().slice(0, 10);
  const orders: Order[] = [];
  let cursor: string | null = null;
  do {
    const d = await gql(tk, Q, { cursor, q: `created_at:>=${since}` });
    for (const o of d.orders.nodes) {
      if (o.cancelledAt || o.test) continue;
      orders.push({ id: o.id, at: new Date(o.createdAt), total: +o.totalPriceSet.shopMoney.amount, cust: o.customer?.id, lifetime: o.customer?.numberOfOrders ? +o.customer.numberOfOrders : undefined, tags: o.customer?.tags ?? [],
        items: o.lineItems.nodes.filter((l: any) => l.product).map((l: any) => ({ pid: l.product.id, title: l.product.title, type: l.product.productType || "Other", qty: l.quantity, rev: +l.originalTotalSet.shopMoney.amount })) });
    }
    cursor = d.orders.pageInfo.hasNextPage ? d.orders.pageInfo.endCursor : null;
  } while (cursor);
  if (!orders.length) throw new Error("No orders in the last 365 days: new store, start from scratch");
  const oldest = orders[0].at; // read_orders without read_all_orders only returns ~60 days
  const coverage = Math.round((Date.now() - oldest.getTime()) / day);

  // Order position per customer: exact when the customer's whole history is inside the window.
  const byCust = new Map<string, Order[]>();
  for (const o of orders) if (o.cust) (byCust.get(o.cust) ?? byCust.set(o.cust, []).get(o.cust)!).push(o);
  const pos = new Map<string, number | null>();
  for (const [, os] of byCust) { os.sort((a, b) => +a.at - +b.at); const complete = os[0].lifetime === os.length || (os[0].lifetime ?? 0) <= os.length; os.forEach((o, i) => pos.set(o.id, complete ? i + 1 : null)); }

  const now = Date.now(), in90 = orders.filter((o) => now - +o.at <= 90 * day);
  const prod = new Map<string, { title: string; type: string; units: number; revenue: number; orders: number; firstOrders: number }>();
  for (const o of in90) for (const it of o.items) {
    const p = prod.get(it.pid) ?? prod.set(it.pid, { title: it.title, type: it.type, units: 0, revenue: 0, orders: 0, firstOrders: 0 }).get(it.pid)!;
    p.units += it.qty; p.revenue += it.rev; p.orders++; if (pos.get(o.id) === 1) p.firstOrders++;
  }
  const best = [...prod.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 15).map((p) => ({ ...p, revenue: Math.round(p.revenue) }));
  const bestFirst = [...prod.values()].sort((a, b) => b.firstOrders - a.firstOrders).slice(0, 8).map((p) => ({ title: p.title, firstOrders: p.firstOrders }));
  const cat = new Map<string, number>(); for (const o of in90) for (const it of o.items) cat.set(it.type, (cat.get(it.type) ?? 0) + it.rev);

  // Repeat behaviour: first-time buyers in the window and their 2nd order.
  const firsts = [...byCust.values()].filter((os) => pos.get(os[0].id) === 1);
  const seconds = firsts.filter((os) => os.length > 1);
  const gaps = seconds.map((os) => Math.round((+os[1].at - +os[0].at) / day)).sort((a, b) => a - b);
  const pct = (xs: number[], p: number) => (xs.length ? xs[Math.min(xs.length - 1, Math.floor(p * xs.length))] : null);
  const paths = new Map<string, number>();
  for (const os of seconds) { const a = os[0].items[0]?.title, b = os[1].items.find((i) => !os[0].items.some((x) => x.pid === i.pid))?.title ?? os[1].items[0]?.title; if (a && b) paths.set(`${a} → ${b}`, (paths.get(`${a} → ${b}`) ?? 0) + 1); }

  // Cohorts (customers, by last order) — the segments worth building in Klaviyo.
  const cust = [...byCust.values()].map((os) => ({ last: +os[os.length - 1].at, n: os.length, spend: os.reduce((t, o) => t + o.total, 0), b2b: os[0].tags.some((t) => /wholesale|b2b/i.test(t)), types: new Set(os.flatMap((o) => o.items.map((i) => i.type))) }));
  const ago = (c: { last: number }) => (now - c.last) / day;
  const reorder = pct(gaps, 0.5) ?? 45;
  const spends = cust.map((c) => c.spend).sort((a, b) => b - a), vipCut = spends[Math.floor(spends.length * 0.1)] ?? 0;
  const topTypes = [...cat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);
  const cohorts = {
    one_time_30_60d: cust.filter((c) => c.n === 1 && ago(c) >= 30 && ago(c) <= 60).length,
    one_time_60_120d: cust.filter((c) => c.n === 1 && ago(c) > 60 && ago(c) <= 120).length,
    due_to_reorder: cust.filter((c) => c.n >= 2 && ago(c) >= reorder && ago(c) <= reorder * 2).length,
    lapsed_repeat_buyers: cust.filter((c) => c.n >= 2 && ago(c) > reorder * 2).length,
    vip_top10pct: { customers: cust.filter((c) => c.spend >= vipCut).length, min_spend_365d: Math.round(vipCut) },
    b2b_tagged: cust.filter((c) => c.b2b).length,
    cross_sell: Object.fromEntries(topTypes.flatMap((a) => topTypes.filter((b) => b !== a).slice(0, 2).map((b) => [`bought ${a}, never ${b}`, cust.filter((c) => c.types.has(a) && !c.types.has(b)).length]))),
  };
  const aov = (os: Order[]) => (os.length ? Math.round((os.reduce((t, o) => t + o.total, 0) / os.length) * 100) / 100 : 0);
  const totals90 = in90.map((o) => o.total).sort((a, b) => a - b);

  const out = {
    pulled_at: new Date().toISOString(), shop: shopInfo, order_history_days: coverage,
    note: coverage < 300 ? "Only ~" + coverage + " days of orders visible: the app needs read_all_orders for full history; repeat/cohort numbers are partial." : undefined,
    last_90d: { orders: in90.length, revenue: Math.round(in90.reduce((t, o) => t + o.total, 0)), aov: aov(in90), order_value_p25_p50_p75_p90: [0.25, 0.5, 0.75, 0.9].map((p) => pct(totals90, p)), revenue_by_type: Object.fromEntries([...cat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => [k, Math.round(v)])), best_sellers: best, best_first_order_products: bestFirst },
    repeat: { first_time_buyers: firsts.length, came_back: seconds.length, repeat_rate: firsts.length ? +(seconds.length / firsts.length).toFixed(3) : null, days_to_2nd_order_p25_p50_p75: [pct(gaps, 0.25), pct(gaps, 0.5), pct(gaps, 0.75)], top_paths: [...paths.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8) },
    cohorts,
  };
  const dir = `clients/${slug}/research`; mkdirSync(dir, { recursive: true });
  const file = `${dir}/shopify-audit-${out.pulled_at.slice(0, 10)}.json`;
  writeFileSync(file, JSON.stringify(out, null, 1));
  console.log(`${shopInfo.name} · ${orders.length} orders over ${coverage} days · 90d revenue ${out.last_90d.revenue} · saved ${file}`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
