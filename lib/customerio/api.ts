// Customer.io App API client (https://api.customer.io or https://api-eu.customer.io, bearer App API key).
// Reads are open; writes are DRAFTS ONLY, mirroring lib/klaviyo/write.ts:
//   - allowed writes: create a one-time send WITHOUT send_now/scheduled_at (a draft), update a draft's content,
//     delete a draft we created (to rebuild it), upload image assets
//   - never: send, schedule, trigger broadcasts, transactional sends, or touch live automations
// Every write is logged to klaviyo_writes (provider "customerio") and needs clients.klaviyo_write = 'drafts'
// (that column is the per-client "may Fluid's bot create drafts in their ESP" switch for every ESP).
import type { SupabaseClient } from "@supabase/supabase-js";

export type CioCreds = { key: string; region: "us" | "eu" };
const HOSTS = { us: "https://api.customer.io", eu: "https://api-eu.customer.io" };

async function call(c: CioCreds, method: string, path: string, body?: unknown, query: Record<string, unknown> = {}): Promise<any> {
  const url = new URL(path, HOSTS[c.region]);
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  for (let attempt = 0; ; attempt++) {
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    const r = await fetch(url, { method, headers: { Authorization: `Bearer ${c.key}`, accept: "application/json", ...(body && !isForm ? { "content-type": "application/json" } : {}) }, body: body ? (isForm ? (body as FormData) : JSON.stringify(body)) : undefined });
    if (r.ok) return r.status === 204 ? {} : r.json().catch(() => ({}));
    if ((r.status === 429 || r.status >= 500) && attempt < 4) { await new Promise((res) => setTimeout(res, 600 * 2 ** attempt)); continue; }
    const t = await r.text().catch(() => "");
    throw new Error(`Customer.io ${method} ${path} failed: HTTP ${r.status} ${t.slice(0, 200)}`);
  }
}

/** Read-only client (reports, audits, audience search). */
export const cioRead = (c: CioCreds) => ({ get: (path: string, query?: Record<string, unknown>) => call(c, "GET", path, undefined, query) });

/** Checks an App API key and finds its data center. Returns null if it works in neither. */
export async function verifyCioKey(key: string): Promise<{ region: "us" | "eu"; senders: number } | null> {
  for (const region of ["us", "eu"] as const) {
    try { const d = await call({ key, region }, "GET", "/v1/sender_identities"); return { region, senders: (d.sender_identities ?? []).length }; } catch { /* try the other region */ }
  }
  return null;
}

/** The client's Customer.io credentials from the vault (null when not connected). */
export async function cioCreds(db: SupabaseClient, clientId: string): Promise<CioCreds | null> {
  const { data: key } = await db.rpc("get_connection_secret", { p_client: clientId, p_provider: "customerio" });
  if (!key) return null;
  const { data: conn } = await db.from("client_connections").select("meta").eq("client_id", clientId).eq("provider", "customerio").maybeSingle();
  return { key: key as string, region: (conn?.meta as any)?.region === "eu" ? "eu" : "us" };
}

const NEVER = /\/(send|schedule|triggers?|cancel)\b|\/v1\/send\/|transactional|\/campaigns\/\d+\/actions|\/broadcasts\/\d+\/actions|\/customers|\/segments\b(?!\/\d+\/customer_count)/i;
const ALLOWED: [string, RegExp][] = [
  ["POST", /^\/v1\/newsletters$/],
  ["PUT", /^\/v1\/newsletters\/\d+\/contents\/\d+$/],
  ["DELETE", /^\/v1\/newsletters\/\d+$/],
  ["POST", /^\/v1\/assets\/files$/],
];

/** Why a write is refused (null = allowed). Drafts only: never send, schedule, trigger or touch automations. */
export function cioWriteBlocked(method: string, path: string, body?: any): string | null {
  if (NEVER.test(path) || !ALLOWED.some(([m, re]) => m === method && re.test(path))) return `Blocked: ${method} ${path} is not a draft-only Customer.io action.`;
  if (path === "/v1/newsletters" && body && (body.send_now || body.scheduled_at)) return "Blocked: Fluid's bot never sends or schedules. Drafts only.";
  return null;
}

/** Draft-only writer for one client. Throws unless the client allows drafts and Customer.io is connected. */
export async function cioDraftWriter(db: SupabaseClient, clientId: string) {
  const { data: cl } = await db.from("clients").select("klaviyo_write").eq("id", clientId).single();
  if (cl?.klaviyo_write !== "drafts") throw new Error("This client hasn't approved Fluid building drafts in their email platform yet (clients.klaviyo_write must be 'drafts').");
  const creds = await cioCreds(db, clientId);
  if (!creds) throw new Error("Customer.io isn't connected for this client.");
  const write = async (method: string, path: string, body?: any) => {
    const blocked = cioWriteBlocked(method, path, body);
    if (blocked) throw new Error(blocked);
    if (method === "DELETE") {
      const n = (await call(creds, "GET", path)).newsletter ?? {};
      if (n.sent_at || n.scheduled_at || (n.send_state && !/draft/i.test(n.send_state))) throw new Error("Blocked: that one-time send is no longer a draft.");
    }
    const res = await call(creds, method, path, body);
    await db.from("klaviyo_writes").insert({ client_id: clientId, method, path: `customerio:${path}`, status: 200, klaviyo_id: String(res?.newsletter?.id ?? res?.asset?.id ?? ""), note: "customerio" }).then(() => {}, () => {});
    return res;
  };
  return { creds, read: cioRead(creds), write };
}
