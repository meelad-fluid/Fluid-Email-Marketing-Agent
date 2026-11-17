// Search a client's Klaviyo lists + segments by what someone says ("engaged 120", "90 day engaged", "VIPs"),
// and build a master-sheet segment when nothing fits. Reads use the client's key; writes go through
// lib/klaviyo/write.ts (per-client permission, no sending possible).
import type { SupabaseClient } from "@supabase/supabase-js";
import { klaviyoAll } from "./api";
import { draftWriter } from "./write";
import { resolveMetricIds, segmentForRequest, type MetricIds, type SegmentSpec } from "./segments";

export type Audience = { id: string; name: string; type: "list" | "segment" };

const STOP = new Set(["fc", "list", "segment", "the", "my", "our", "email", "emails", "audience", "group", "of", "for", "and", "to", "in", "last", "days", "day", "d", "people", "profiles", "subscribers"]);
export function tokens(s: string) {
  return s.toLowerCase().replace(/[’']s\b/g, "").replace(/(\d+)\s*-?\s*(?:day|days|d)\b/g, "$1").split(/[^a-z0-9$+]+/).filter((w) => w && !STOP.has(w));
}

async function keyFor(db: SupabaseClient, clientId: string) {
  const { data: key } = await db.rpc("get_connection_secret", { p_client: clientId, p_provider: "klaviyo" });
  if (!key) throw new Error("This client has no Klaviyo connection.");
  return key as string;
}

export async function allAudiences(db: SupabaseClient, clientId: string): Promise<Audience[]> {
  const key = await keyFor(db, clientId);
  const [l, s] = await Promise.all([klaviyoAll<any>(key, "/lists/?fields[list]=name"), klaviyoAll<any>(key, "/segments/?fields[segment]=name")]);
  return [...l.data.map((g: any) => ({ id: g.id, name: g.attributes.name.trim(), type: "list" as const })), ...s.data.map((g: any) => ({ id: g.id, name: g.attributes.name.trim(), type: "segment" as const }))];
}

/** Best matches for a spoken name. A number in the request (90, 120, 180…) must appear in the match. */
export function rank(query: string, all: Audience[]) {
  const q = tokens(query);
  const nums = q.filter((w) => /^\d+$/.test(w));
  const words = q.filter((w) => !/^\d+$/.test(w));
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return all
    .map((a) => {
      if (norm(a.name) === norm(query)) return { ...a, score: 100 };
      const t = new Set(tokens(a.name));
      if (nums.some((n) => !t.has(n))) return { ...a, score: 0 };
      const hit = words.filter((w) => t.has(w) || [...t].some((x) => x.startsWith(w) || w.startsWith(x))).length;
      const score = q.length ? Math.round(((hit + nums.length) / q.length) * 80) - Math.min(15, Math.max(0, t.size - q.length) * 3) : 0;
      return { ...a, score };
    })
    .filter((a) => a.score > 25)
    .sort((a, b) => b.score - a.score || a.name.length - b.name.length);
}

export async function findAudiences(db: SupabaseClient, clientId: string, query: string, limit = 6) {
  return rank(query, await allAudiences(db, clientId)).slice(0, limit);
}

/** Resolve a name or id to one audience: exact id/name, else a clear best match (score ≥ 60 and ahead of the next). */
export function pick(query: string, all: Audience[]): Audience | undefined {
  const byId = all.find((a) => a.id === query.trim());
  if (byId) return byId;
  const r = rank(query, all);
  if (!r.length || r[0].score < 60) return undefined;
  if (r[0].score < 100 && r[1] && r[1].score >= r[0].score - 5) return undefined; // too close to call: ask
  return r[0];
}

/** Create the master-sheet segment a request describes ("engaged 120"), unless one with that name exists. */
export async function buildSegment(db: SupabaseClient, clientId: string, request: string): Promise<{ created: boolean; audience: Audience; spec: SegmentSpec } | { error: string }> {
  const spec = segmentForRequest(request);
  if (!spec) return { error: `"${request}" isn't one of the master-sheet segments (Engaged X, Engaged 30 ex. Purchasers / New Subs, Placed Order X days, Lapsed Customers / Winback).` };
  const all = await allAudiences(db, clientId);
  const existing = all.find((a) => a.name.toLowerCase() === spec.name.toLowerCase());
  if (existing) return { created: false, audience: existing, spec };
  const key = await keyFor(db, clientId);
  const ids: MetricIds = resolveMetricIds((await klaviyoAll<any>(key, "/metrics/")).data);
  const missing = spec.needs.filter((n) => !ids[n]);
  if (missing.length) return { error: `This account has no ${missing.join(", ")} metric, so ${spec.name} can't be built as specified.` };
  const k = await draftWriter(db, clientId);
  const r = await k.post("/segments", { data: { type: "segment", attributes: { name: spec.name, definition: spec.definition(ids as Required<MetricIds>) } } }, spec.name);
  return { created: true, audience: { id: r.data.id, name: spec.name, type: "segment" }, spec };
}
