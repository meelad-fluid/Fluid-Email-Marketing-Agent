// Builds Fluid's segmentation master sheet (knowledge/sops/segmentation-master.md) in a client's Klaviyo.
// Dry run by default: shows what would be created and what already exists. --push creates the missing ones
// (requires clients.klaviyo_write = 'drafts'; segments never send anything).
// Usage: npx tsx scripts/klaviyo-segments.ts <client-folder> [--push]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { klaviyoAll } from "../lib/klaviyo/api";
import { draftWriter } from "../lib/klaviyo/write";
import { METRICS, resolveMetricIds, segmentPack, type MetricIds } from "../lib/klaviyo/segments";

for (const [, k, v] of readFileSync(join(__dirname, "../.env.local"), "utf8").matchAll(/^([A-Z_]+)=(.*)$/gm)) process.env[k] ??= v.trim();
const folder = process.argv[2];
const PUSH = process.argv.includes("--push");
if (!folder) throw new Error("Usage: klaviyo-segments.ts <client-folder> [--push]");

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: client } = await db.from("clients").select("id, name").eq("folder", folder).single();
  if (!client) throw new Error(`No client with folder ${folder}`);
  const { data: key } = await db.rpc("get_connection_secret", { p_client: client.id, p_provider: "klaviyo" });
  if (!key) throw new Error(`No Klaviyo key for ${client.name}`);
  const ids = resolveMetricIds((await klaviyoAll<any>(key, "/metrics/")).data);
  const existing = new Set((await klaviyoAll<any>(key, "/segments/?fields[segment]=name")).data.map((s: any) => s.attributes.name.trim().toLowerCase()));
  const todo = [];
  for (const s of segmentPack()) {
    const missing = s.needs.filter((n) => !ids[n]);
    const state = existing.has(s.name.toLowerCase()) ? "exists" : missing.length ? `skip: no "${missing.map((n) => METRICS[n][0]).join('", "')}" metric` : "to create";
    console.log(`${state.padEnd(10)} ${s.name}  (${s.purpose})`);
    if (state === "to create") todo.push(s);
  }
  if (!PUSH) return console.log(`\nDry run: ${todo.length} segment(s) would be created. Add --push to create them.`);
  const k = await draftWriter(db, client.id);
  for (const s of todo) {
    try {
      const r = await k.post("/segments", { data: { type: "segment", attributes: { name: s.name, definition: s.definition(ids as Required<MetricIds>) } } }, s.name);
      console.log(`✓ created ${s.name} (${r.data.id})`);
    } catch (e: any) { console.log(`✗ ${s.name}: ${e.message}`); }
  }
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
