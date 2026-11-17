import { cookies } from "next/headers";
import { checkShopify } from "@/lib/connections/shopify";
import { finishInstall, OAUTH_COOKIE } from "@/lib/connections/shopify-oauth";
import { getStore } from "@/lib/store";

// Shopify redirects here after the client approves Fluid's app. Verifies everything, stores the
// token encrypted, and sends the client back to their onboarding page.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const raw = jar.get(OAUTH_COOKIE)?.value;
  jar.delete({ name: OAUTH_COOKIE, path: "/api/shopify" });
  const cookie = raw ? (JSON.parse(raw) as { n: string; t: string }) : null;
  const back = (q: string) => Response.redirect(new URL(cookie ? `/onboard/${cookie.t}?shopify=${q}#connections` : "/", url.origin));

  const result = await finishInstall(url.searchParams, cookie?.n);
  if (!result.ok) return back(encodeURIComponent(result.error));
  const store = getStore();
  const client = cookie ? await store.resolveOnboardingToken(cookie.t) : null;
  if (!client || client.id !== result.clientId) return back(encodeURIComponent("Your onboarding link changed during the install. Start again."));
  const check = await checkShopify(result.shop, result.accessToken);
  if (!check.ok) return back(encodeURIComponent(check.error));
  await store.saveConnection(client.id, "shopify", result.accessToken, { shop: check.shop, via: "oauth", missing_recommended: check.missingRecommended }, check.shopName);
  return back("connected");
}
