// Pushes brain/flows/*.json (frameworks, pop-up, system) to Supabase flow_frameworks, one row per key+version.
// Usage: npm run brain:flows:push
import { readdirSync, readFileSync } from "node:fs";

for (const [, k, v] of readFileSync(".env.local", "utf8").matchAll(/^([A-Z_]+)=(.*)$/gm)) process.env[k] ??= v.trim();

async function main() {
  const { supabaseAdmin } = await import("../lib/supabase/admin");
  const db = supabaseAdmin();
  const rows = readdirSync("brain/flows")
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const d = JSON.parse(readFileSync(`brain/flows/${f}`, "utf8"));
      const key = f.replace(/\.json$/, "");
      return { key, version: d.version, name: d.name ?? (key === "system" ? "Fluid flow system: offer ladder + rules" : key), status: d.status ?? "active", definition: d };
    });
  const { error } = await db.from("flow_frameworks").upsert(rows, { onConflict: "key,version" });
  if (error) throw error;
  console.log(`Pushed ${rows.length}: ${rows.map((r) => r.key).join(", ")}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
