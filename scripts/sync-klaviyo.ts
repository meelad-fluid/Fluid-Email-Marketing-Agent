// Syncs Klaviyo data into Supabase for one client (by slug) or every client with Klaviyo connected.
// Usage: npm run sync:klaviyo -- [client-slug]
import { readFileSync } from "node:fs";

for (const [, k, v] of readFileSync(".env.local", "utf8").matchAll(/^([A-Z_]+)=(.*)$/gm)) process.env[k] ??= v.trim();

async function main() {
  const { supabaseAdmin } = await import("../lib/supabase/admin");
  const { syncKlaviyo } = await import("../lib/klaviyo/sync");
  const slug = process.argv[2];
  let q = supabaseAdmin().from("clients").select("id, name, slug, client_connections!inner(provider, status)").eq("client_connections.provider", "klaviyo").eq("client_connections.status", "connected");
  if (slug) q = q.eq("slug", slug);
  const { data: clients, error } = await q;
  if (error) throw error;
  if (!clients?.length) return console.log(slug ? `No client "${slug}" with Klaviyo connected` : "No clients with Klaviyo connected");
  for (const c of clients) {
    const t = Date.now();
    const r = await syncKlaviyo(c.id);
    console.log(`${c.name}: ${r.ok ? `ok in ${Math.round((Date.now() - t) / 1000)}s ${JSON.stringify(r.counts)}` : `FAILED ${r.error}`}`);
  }
}
main().catch((e) => { console.error(e.message); process.exit(1); });
