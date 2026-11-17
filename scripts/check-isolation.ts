// Fails if any server query on a client-owned table isn't scoped to one client.
// A query passes when, within its statement, it filters/inserts by client_id, or targets one row by its own id
// (id / plan_id / work_item_id, which belong to exactly one client). Run in CI: npm run check:isolation
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const CLIENT_TABLES = /from\("(klaviyo_[a-z_]+|campaign_plans|plan_sends|profile_answers|brand_kits|assets|work_items|client_flows|client_preferences|client_connections|client_members|onboarding_links|designs|approvals|comments)"\)/;
const SCOPED = /client_id|\.eq\("(id|plan_id|work_item_id)"|storage_path/;
const files: string[] = [];
const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (f !== "node_modules") walk(p); } else if (/\.tsx?$/.test(f)) files.push(p); } };
["lib", "app"].forEach(walk);
let bad = 0;
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((l, i) => {
    if (!CLIENT_TABLES.test(l)) return;
    // the whole statement: from the line that starts it (up to 2 above) to the first line ending in ";"
    let end = i; while (end < lines.length - 1 && end < i + 60 && !/;\s*$/.test(lines[end])) end++;
    const stmt = lines.slice(Math.max(0, i - 2), end + 1).join(" ");
    if (!SCOPED.test(stmt)) { bad++; console.log(`✗ ${f}:${i + 1}  ${l.trim()}`); }
  });
}
if (bad) { console.log(`\n${bad} unscoped client-table quer${bad === 1 ? "y" : "ies"}: add .eq("client_id", clientId).`); process.exit(1); }
console.log(`✓ Every client-table query in lib/ and app/ is scoped to one client (${files.length} files).`);
