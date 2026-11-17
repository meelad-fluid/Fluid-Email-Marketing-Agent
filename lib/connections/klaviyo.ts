// Checks a client's Klaviyo private API key with read-only requests before it's stored: that it
// works, which account it belongs to, and which areas the bot needs it can read. Write access can't
// be checked without writing, so clients are asked for a Full Access key.

const REVISION = "2025-10-15";

// Area → a cheap read request. 403 means the key lacks that scope.
const AREAS: Record<string, string> = {
  Flows: "/flows/?page[size]=1",
  Lists: "/lists/?page[size]=1",
  Segments: "/segments/?page[size]=1",
  Campaigns: "/campaigns/?filter=equals(messages.channel,'email')&page[size]=1",
  Templates: "/templates/?page[size]=1",
  Metrics: "/metrics/",
};

export type KlaviyoCheck =
  | { ok: true; accountName: string; accountId: string; missingScopes: string[] }
  | { ok: false; error: string };

const get = (path: string, key: string) =>
  fetch(`https://a.klaviyo.com/api${path}`, {
    headers: { Authorization: `Klaviyo-API-Key ${key}`, revision: REVISION, accept: "application/vnd.api+json" },
    cache: "no-store",
  });

export async function checkKlaviyoKey(raw: string): Promise<KlaviyoCheck> {
  const key = raw.trim();
  if (!/^pk_[A-Za-z0-9_]{20,}$/.test(key)) return { ok: false, error: "That doesn't look like a Klaviyo private key. It starts with pk_." };
  const res = await get("/accounts/", key);
  if (res.status === 401) return { ok: false, error: "Klaviyo didn't accept this key. Check it was copied in full, or create a new one." };
  if (res.status === 403) return { ok: false, error: "This key can't read the account. Create a Full Access private key instead." };
  if (!res.ok) return { ok: false, error: `Klaviyo returned an error (${res.status}). Try again in a minute.` };
  const account = (await res.json()).data?.[0];
  const results = await Promise.all(Object.entries(AREAS).map(async ([area, path]) => [area, (await get(path, key)).status] as const));
  return {
    ok: true,
    accountId: account?.id ?? "",
    accountName: account?.attributes?.contact_information?.organization_name || account?.id || "Klaviyo account",
    missingScopes: results.filter(([, status]) => status === 403).map(([area]) => area),
  };
}
