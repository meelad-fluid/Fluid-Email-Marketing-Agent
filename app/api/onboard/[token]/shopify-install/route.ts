import { cookies } from "next/headers";
import { OAUTH_COOKIE, shopifyOAuthEnabled, startInstall } from "@/lib/connections/shopify-oauth";
import { clientForToken, linkExpired } from "@/lib/onboarding/link";

// GET ?shop=brand.myshopify.com → sends the client to Shopify to approve Fluid's app.
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = await clientForToken(token);
  if (!client) return linkExpired();
  const url = new URL(req.url);
  if (!shopifyOAuthEnabled()) return Response.redirect(new URL(`/onboard/${token}?shopify=unavailable#connections`, url.origin));
  const start = startInstall(client.id, url.searchParams.get("shop") ?? "", url.origin);
  if (!start) return Response.redirect(new URL(`/onboard/${token}?shopify=bad-shop#connections`, url.origin));
  // Binds the install to this browser and remembers where to return.
  (await cookies()).set(OAUTH_COOKIE, JSON.stringify({ n: start.nonce, t: token }), { httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", maxAge: 600, path: "/api/shopify" });
  return Response.redirect(start.url);
}
