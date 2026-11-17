import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { normalizeShopDomain, SHOPIFY_RECOMMENDED_SCOPES, SHOPIFY_REQUIRED_SCOPES } from "./shopify";

// "Install Fluid on Shopify": the standard Shopify OAuth install for Fluid's app (created once in
// Shopify's Dev Dashboard). Since January 2026 merchants can't create new custom apps in their admin,
// so this is the main way a client connects a store. Needs SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET.

export const shopifyOAuthEnabled = () => !!(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET);
const secret = () => process.env.SHOPIFY_CLIENT_SECRET!;
const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export const OAUTH_COOKIE = "fluid_shopify_oauth";

// state = <payload>.<signature>; payload ties the install to one client, one browser and 10 minutes.
export function startInstall(clientId: string, shopInput: string, origin: string) {
  const shop = normalizeShopDomain(shopInput);
  if (!shop) return null;
  const nonce = randomBytes(16).toString("base64url");
  const payload = b64(JSON.stringify({ c: clientId, s: shop, n: nonce, e: Date.now() + 10 * 60_000 }));
  const state = `${payload}.${sign(payload)}`;
  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.set("client_id", process.env.SHOPIFY_CLIENT_ID!);
  url.searchParams.set("scope", [...SHOPIFY_REQUIRED_SCOPES, ...SHOPIFY_RECOMMENDED_SCOPES].join(","));
  url.searchParams.set("redirect_uri", `${origin}/api/shopify/callback`);
  url.searchParams.set("state", state);
  return { url: url.toString(), nonce };
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

// Shopify signs the callback's query string with the app secret.
function validShopifyHmac(params: URLSearchParams) {
  const hmac = params.get("hmac") ?? "";
  const message = [...params.entries()]
    .filter(([k]) => k !== "hmac" && k !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return safeEqual(createHmac("sha256", secret()).update(message).digest("hex"), hmac);
}

export type CallbackResult = { ok: true; clientId: string; shop: string; accessToken: string } | { ok: false; error: string };

export async function finishInstall(params: URLSearchParams, cookieNonce: string | undefined): Promise<CallbackResult> {
  if (!validShopifyHmac(params)) return { ok: false, error: "The response from Shopify couldn't be verified." };
  const [payload, sig] = (params.get("state") ?? "").split(".");
  if (!payload || !sig || !safeEqual(sign(payload), sig)) return { ok: false, error: "This install link isn't valid. Start again from your onboarding page." };
  const st = JSON.parse(Buffer.from(payload, "base64url").toString()) as { c: string; s: string; n: string; e: number };
  if (Date.now() > st.e) return { ok: false, error: "The install took too long. Start again from your onboarding page." };
  if (!cookieNonce || !safeEqual(cookieNonce, st.n)) return { ok: false, error: "Finish the install in the same browser you started it in." };
  const shop = normalizeShopDomain(params.get("shop") ?? "");
  if (!shop || shop !== st.s) return { ok: false, error: "Shopify returned a different store than the one you entered." };

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: secret(), code: params.get("code") }),
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, error: `Shopify didn't complete the install (${res.status}). Try again.` };
  const { access_token } = (await res.json()) as { access_token?: string };
  if (!access_token) return { ok: false, error: "Shopify didn't return an access token. Try again." };
  return { ok: true, clientId: st.c, shop, accessToken: access_token };
}
