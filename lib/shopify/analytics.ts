// Shopify Analytics for the onboarding audit, through ShopifyQL (Admin GraphQL shopifyqlQuery; needs read_reports).
// Sales trend, best sellers, new vs returning, and the storefront funnel (sessions, conversion, traffic sources,
// devices, landing pages). Each query runs on its own: one that Shopify rejects is recorded with its error and the
// rest still come back, so the onboarding always gets what's available.
import { shopifyRead, type ShopifyConn } from "./client";

const QUERIES: Record<string, { q: string; why: string }> = {
  sales_by_month: { q: "FROM sales SHOW total_sales, orders, average_order_value TIMESERIES month SINCE -12m UNTIL today", why: "Seasonality and the revenue baseline email is measured against" },
  new_vs_returning: { q: "FROM sales SHOW total_sales, orders, average_order_value GROUP BY customer_type SINCE -90d UNTIL today", why: "How much revenue repeat buyers drive (post-purchase / winback headroom)" },
  top_products: { q: "FROM sales SHOW total_sales, net_items_sold GROUP BY product_title SINCE -90d UNTIL today ORDER BY total_sales DESC LIMIT 15", why: "What campaigns lead with" },
  sessions_by_month: { q: "FROM sessions SHOW sessions, conversion_rate TIMESERIES month SINCE -6m UNTIL today", why: "Traffic and conversion trend" },
  traffic_sources: { q: "FROM sessions SHOW sessions, conversion_rate GROUP BY referrer_source SINCE -90d UNTIL today ORDER BY sessions DESC LIMIT 12", why: "Where shoppers come from; how email converts next to other channels" },
  devices: { q: "FROM sessions SHOW sessions, conversion_rate GROUP BY device_type SINCE -90d UNTIL today", why: "Mobile share (design for the phone first)" },
  landing_pages: { q: "FROM sessions SHOW sessions, conversion_rate GROUP BY landing_page_path SINCE -90d UNTIL today ORDER BY sessions DESC LIMIT 15", why: "Pages worth linking to, and pages that leak" },
  funnel: { q: "FROM sessions SHOW sessions, sessions_with_cart_additions, sessions_that_reached_checkout, sessions_that_completed_checkout SINCE -90d UNTIL today", why: "Where browsers drop off (browse / cart / checkout abandonment volume)" },
};

const GQL = `query($q: String!) { shopifyqlQuery(query: $q) { tableData { columns { name dataType displayName } rows } parseErrors } }`;

export async function shopifyAnalytics(c: ShopifyConn) {
  const out: Record<string, unknown> = { pulled_at: new Date().toISOString(), note: "ShopifyQL (Shopify Analytics). A section with an error means this store or API version doesn't support that report." };
  for (const [name, { q, why }] of Object.entries(QUERIES)) {
    try {
      const d = await shopifyRead(c, GQL, { q });
      const r = d.shopifyqlQuery;
      if (r?.parseErrors?.length) out[name] = { why, query: q, error: JSON.stringify(r.parseErrors).slice(0, 300) };
      else out[name] = { why, columns: (r?.tableData?.columns ?? []).map((x: any) => x.name), rows: (r?.tableData?.rows ?? []).slice(0, 40) };
    } catch (e: any) { out[name] = { why, query: q, error: e.message.slice(0, 300) }; }
  }
  return out;
}
