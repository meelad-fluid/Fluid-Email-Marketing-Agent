// One client's Shopify store, from the vault. Two ways a store can be connected:
//   - an Admin API access token (shpat_/shpca_…), e.g. from Fluid's app install (OAuth) or a merchant-made app
//   - a Dev Dashboard app the merchant created on their store: Client ID (in meta) + Client secret (shpss_…),
//     exchanged for a 24-hour token with the client-credentials grant
// Reads go through shopifyRead(), which refuses any mutation. The only writes are in lib/shopify/discounts.ts.
import type { SupabaseClient } from "@supabase/supabase-js";

export const SHOPIFY_API = "2025-10";
/** What Fluid asks for. Analytics needs read_reports; discount codes need write_discounts. */
export const SHOPIFY_SCOPES = { read: ["read_orders", "read_all_orders", "read_products", "read_customers", "read_reports"], write: ["write_discounts"] };

export type ShopifyConn = { shop: string; token: string };
const cache = new Map<string, { token: string; until: number }>();

export function normalizeShop(input: string): string | null {
  const s = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const handle = s.endsWith(".myshopify.com") ? s.slice(0, -".myshopify.com".length) : s.includes(".") ? null : s;
  return handle && /^[a-z0-9][a-z0-9-]{0,60}$/.test(handle) ? `${handle}.myshopify.com` : null;
}

async function exchange(shop: string, clientId: string, secret: string) {
  const r = await fetch(`https://${shop}/admin/oauth/access_token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: secret }) });
  if (!r.ok) throw new Error(`Shopify didn't accept the app's Client ID and secret for ${shop} (${r.status}). Check the app is installed on this store.`);
  const j = await r.json();
  return { token: j.access_token as string, until: Date.now() + Math.max(60, (j.expires_in ?? 86400) - 300) * 1000 };
}

/** Resolve credentials to a working token (used to verify before storing, and on every run). */
export async function tokenFor(shop: string, secret: string, clientId?: string): Promise<string> {
  if (/^shp(at|ca|ua|pa)_/i.test(secret)) return secret;
  if (!clientId) throw new Error("A Client secret (shpss_…) needs the app's Client ID too.");
  const k = `${shop}:${clientId}`, hit = cache.get(k);
  if (hit && hit.until > Date.now()) return hit.token;
  const t = await exchange(shop, clientId, secret);
  cache.set(k, t);
  return t.token;
}

export async function shopifyConn(db: SupabaseClient, clientId: string): Promise<ShopifyConn | null> {
  const { data: secret } = await db.rpc("get_connection_secret", { p_client: clientId, p_provider: "shopify" });
  if (!secret) return null;
  const { data: c } = await db.from("client_connections").select("meta").eq("client_id", clientId).eq("provider", "shopify").maybeSingle();
  const meta = (c?.meta ?? {}) as { shop?: string; client_id?: string };
  if (!meta.shop) return null;
  return { shop: meta.shop, token: await tokenFor(meta.shop, secret as string, meta.client_id) };
}

/** Admin GraphQL, read-only: anything containing a mutation is refused. */
export async function shopifyRead<T = any>(c: ShopifyConn, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (/\bmutation\b/i.test(query)) throw new Error("Refused: shopifyRead is read-only");
  return gqlRaw(c, query, variables);
}

/** Internal: also used by the discount writer with its fixed mutations. */
export async function gqlRaw<T = any>(c: ShopifyConn, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`https://${c.shop}/admin/api/${SHOPIFY_API}/graphql.json`, { method: "POST", headers: { "content-type": "application/json", "X-Shopify-Access-Token": c.token }, body: JSON.stringify({ query, variables }) });
    if (r.status === 401 || r.status === 403) throw new Error(`Shopify refused access (${r.status}). The connection may be missing a scope or was uninstalled.`);
    const j: any = await r.json().catch(() => ({}));
    if (j.errors?.some?.((e: any) => e.extensions?.code === "THROTTLED") && attempt < 6) { await new Promise((s) => setTimeout(s, 1500 * (attempt + 1))); continue; }
    if (j.errors) throw new Error(`Shopify: ${(Array.isArray(j.errors) ? j.errors.map((e: any) => e.message).join("; ") : JSON.stringify(j.errors)).slice(0, 300)}`);
    return j.data as T;
  }
}

/** Store name and which of Fluid's scopes the connection has. */
export async function checkConn(c: ShopifyConn) {
  const shop = (await shopifyRead(c, `{ shop { name currencyCode ianaTimezone } }`)).shop;
  const scopes = await fetch(`https://${c.shop}/admin/oauth/access_scopes.json`, { headers: { "X-Shopify-Access-Token": c.token } }).then((r) => (r.ok ? r.json() : { access_scopes: [] })).catch(() => ({ access_scopes: [] }));
  const granted = new Set<string>((scopes.access_scopes ?? []).map((s: any) => s.handle));
  const has = (s: string) => granted.has(s) || granted.has(s.replace(/^read_/, "write_"));
  return { name: shop.name as string, currency: shop.currencyCode as string, timezone: shop.ianaTimezone as string, missing_read: SHOPIFY_SCOPES.read.filter((s) => !has(s)), can_create_discounts: has("write_discounts") };
}
