import { checkKlaviyoKey } from "@/lib/connections/klaviyo";
import { checkShopify } from "@/lib/connections/shopify";
import { clientForToken, json, linkExpired } from "@/lib/onboarding/link";
import { getStore } from "@/lib/store";

// POST { provider: "klaviyo", key } or { provider: "shopify", shop, token }.
// The key is checked against the provider first and stored only if it works. It's never sent back.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const client = await clientForToken((await params).token);
  if (!client) return linkExpired();
  const b = await req.json().catch(() => null);
  const store = getStore();

  if (b?.provider === "klaviyo" && typeof b.key === "string") {
    const r = await checkKlaviyoKey(b.key);
    if (!r.ok) return json({ error: r.error }, 422);
    if (r.missingScopes.length) return json({ error: `This key can't read: ${r.missingScopes.join(", ")}. Create a Full Access private key instead.` }, 422);
    await store.saveConnection(client.id, "klaviyo", b.key.trim(), { account_id: r.accountId }, r.accountName);
    return json({ connection: { provider: "klaviyo", status: "connected", account_name: r.accountName } });
  }

  if (b?.provider === "shopify" && typeof b.shop === "string" && typeof b.token === "string") {
    const r = await checkShopify(b.shop, b.token);
    if (!r.ok) return json({ error: r.error }, 422);
    if (r.missingScopes.length) return json({ error: `This token is missing access to: ${r.missingScopes.join(", ")}. Add those scopes to the app and try again.` }, 422);
    await store.saveConnection(client.id, "shopify", b.token.trim(), { shop: r.shop, missing_recommended: r.missingRecommended }, r.shopName);
    return json({ connection: { provider: "shopify", status: "connected", account_name: r.shopName }, warning: r.missingRecommended.length ? `Connected. For full order history, also add: ${r.missingRecommended.join(", ")}.` : null });
  }

  return json({ error: "Unknown connection" }, 400);
}
