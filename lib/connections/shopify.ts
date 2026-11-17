// Checks a client's Shopify store domain + Admin API access token with read-only requests before
// it's stored: that it works, the store's name, and that it has the read scopes reporting needs.
// Long term, a Fluid Shopify app with an install link replaces pasting a token.

const API_VERSION = "2026-07";
export const SHOPIFY_REQUIRED_SCOPES = ["read_products", "read_orders", "read_customers"];
export const SHOPIFY_RECOMMENDED_SCOPES = ["read_all_orders", "read_inventory"];

export type ShopifyCheck =
  | { ok: true; shop: string; shopName: string; missingScopes: string[]; missingRecommended: string[] }
  | { ok: false; error: string };

// Accepts "brand.myshopify.com", "https://brand.myshopify.com/admin", or just "brand".
export function normalizeShopDomain(input: string): string | null {
  const s = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const handle = s.endsWith(".myshopify.com") ? s.slice(0, -".myshopify.com".length) : s.includes(".") ? null : s;
  return handle && /^[a-z0-9][a-z0-9-]{0,60}$/.test(handle) ? `${handle}.myshopify.com` : null;
}

export async function checkShopify(domainInput: string, rawToken: string): Promise<ShopifyCheck> {
  const shop = normalizeShopDomain(domainInput);
  if (!shop) return { ok: false, error: "Use your store's .myshopify.com address (Shopify admin → Settings → Domains)." };
  const token = rawToken.trim();
  if (!/^shp(at|ca|pa|ua)_[a-f0-9]{20,}$/i.test(token)) return { ok: false, error: "That doesn't look like a Shopify Admin API access token. It starts with shpat_." };
  const headers = { "X-Shopify-Access-Token": token, accept: "application/json" };
  const res = await fetch(`https://${shop}/admin/api/${API_VERSION}/shop.json`, { headers, cache: "no-store" });
  if (res.status === 401 || res.status === 403) return { ok: false, error: "Shopify didn't accept this token for that store. Check both were copied in full." };
  if (res.status === 404) return { ok: false, error: `We couldn't find ${shop}. Check the store address.` };
  if (!res.ok) return { ok: false, error: `Shopify returned an error (${res.status}). Try again in a minute.` };
  const shopName: string = (await res.json()).shop?.name ?? shop;
  const scopesRes = await fetch(`https://${shop}/admin/oauth/access_scopes.json`, { headers, cache: "no-store" });
  const granted = new Set<string>(scopesRes.ok ? ((await scopesRes.json()).access_scopes ?? []).map((s: { handle: string }) => s.handle) : []);
  // write_x implies read_x
  const has = (scope: string) => granted.has(scope) || granted.has(scope.replace(/^read_/, "write_"));
  return {
    ok: true,
    shop,
    shopName,
    missingScopes: SHOPIFY_REQUIRED_SCOPES.filter((s) => !has(s)),
    missingRecommended: SHOPIFY_RECOMMENDED_SCOPES.filter((s) => !has(s)),
  };
}
