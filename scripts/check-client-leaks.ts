// Scans finished work for another brand's name before it's handed over (rules in lib/leaks.ts).
// Usage: npx tsx scripts/check-client-leaks.ts <slug> <file> [file...]
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { foreignNames, scanText } from "../lib/leaks";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = join(root, ".env.local");
if (existsSync(env)) for (const [, k, v] of readFileSync(env, "utf8").matchAll(/^([A-Z_]+)=(.*)$/gm)) process.env[k] ??= v.trim();

const [slug, ...files] = process.argv.slice(2);
if (!slug || !files.length) throw new Error("Usage: check-client-leaks.ts <slug> <file> [file...]");

async function main() {
  let db;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = await import("@supabase/supabase-js");
    db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  }
  const names = await foreignNames(join(root, "clients"), slug, db);
  let hits = 0;
  for (const f of files) for (const p of scanText(readFileSync(f, "utf8"), names)) { hits++; console.log(`✗ ${f}: ${p}`); }
  if (hits) {
    console.log(`\n${hits} problem(s) in ${slug}'s work: other brands or internal-only wording. Fix before anything goes to the client.`);
    process.exit(1);
  }
  console.log(`✓ No other brand found in ${files.length} file(s) for ${names.ownName} (checked ${names.foreign.size} names).`);
}
main();
