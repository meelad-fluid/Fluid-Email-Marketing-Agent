// The ONLY way Fluid's code writes to a client's Klaviyo. Drafts only, enforced here:
//   - the client must have clients.klaviyo_write = 'drafts' (default 'none' = read only)
//   - only these calls are allowed: upload an image, create a template, create a campaign (Klaviyo creates
//     campaigns as drafts), assign a template to a campaign message, create a segment
//   - anything that sends, schedules, cancels, deletes, changes flows or touches profiles is refused,
//     whatever the caller asks for. There is deliberately no code path to /campaign-send-jobs.
// Every write is logged in klaviyo_writes.
import type { SupabaseClient } from "@supabase/supabase-js";
import { KLAVIYO_REVISION } from "./api";

const BASE = "https://a.klaviyo.com/api";
const ALLOWED: [string, RegExp][] = [
  ["POST", /^\/image-upload\/?$/],
  ["POST", /^\/templates\/?$/],
  ["POST", /^\/campaigns\/?$/],
  ["POST", /^\/campaign-message-assign-template\/?$/],
  ["POST", /^\/segments\/?$/],
];
const NEVER = /send-job|send_job|schedule|cancel|flow-action|flows\/|profile|subscri|suppress|delete|bulk|webhook|catalog|coupon/i;

export class DraftOnlyError extends Error {}

export type KlaviyoWriter = { post: <T = any>(path: string, body: unknown, note?: string, revision?: string) => Promise<T>; upload: (file: Buffer, name: string, type: string) => Promise<{ id: string; url: string }> };

export async function draftWriter(db: SupabaseClient, clientId: string): Promise<KlaviyoWriter> {
  const { data: c, error } = await db.from("clients").select("name, klaviyo_write").eq("id", clientId).single();
  if (error || !c) throw new DraftOnlyError("Client not found");
  if (c.klaviyo_write !== "drafts") throw new DraftOnlyError(`${c.name}'s Klaviyo is read-only for Fluid's tools (clients.klaviyo_write = '${c.klaviyo_write}'). An admin has to allow drafts first.`);
  const { data: key, error: kErr } = await db.rpc("get_connection_secret", { p_client: clientId, p_provider: "klaviyo" });
  if (kErr || !key) throw new Error(`No Klaviyo key for ${c.name}`);

  const check = (method: string, path: string) => {
    if (NEVER.test(path) || !ALLOWED.some(([m, re]) => m === method && re.test(path))) throw new DraftOnlyError(`Refused: ${method} ${path} is not a draft-only call`);
  };
  const log = (method: string, path: string, status: number, id?: string, note?: string) =>
    db.from("klaviyo_writes").insert({ client_id: clientId, method, path, status, klaviyo_id: id ?? null, note: note ?? null }).then(() => {});

  async function call(method: string, path: string, init: RequestInit, note?: string, attempt = 0, revision = KLAVIYO_REVISION): Promise<any> {
    check(method, path);
    const res = await fetch(`${BASE}${path}`, { ...init, method, headers: { Authorization: `Klaviyo-API-Key ${key}`, revision, accept: "application/vnd.api+json", ...(init.headers ?? {}) } });
    if (res.status === 429 && attempt < 5) {
      await new Promise((r) => setTimeout(r, (Number(res.headers.get("retry-after")) || 2 ** attempt * 2) * 1000));
      return call(method, path, init, note, attempt + 1, revision);
    }
    const body = await res.json().catch(() => ({}));
    await log(method, path, res.status, body?.data?.id, note);
    if (!res.ok) throw new Error(`Klaviyo ${res.status} on ${method} ${path}: ${body.errors?.map((e: any) => e.detail).join("; ") ?? "failed"}`);
    return body;
  }

  return {
    post: (path, body, note, revision) => call("POST", path, { body: JSON.stringify(body), headers: { "content-type": "application/vnd.api+json" } }, note, 0, revision),
    upload: async (file, name, type) => {
      const form = new FormData();
      form.append("file", new Blob([new Uint8Array(file)], { type }), name);
      form.append("name", name);
      form.append("hidden", "true");
      const r = await call("POST", "/image-upload", { body: form }, name);
      return { id: String(r.data.id), url: r.data.attributes.image_url };
    },
  };
}
