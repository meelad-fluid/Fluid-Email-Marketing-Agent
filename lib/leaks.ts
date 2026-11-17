// Finds another brand's name or internal-only wording in text meant for one client.
// Foreign names = every other client (clients/ folders + Supabase clients table) and every brand in the
// reference library, minus this client's own names. Used by scripts/check-client-leaks.ts and the Slack bot.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";

export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const title = (dir: string) => (existsSync(join(dir, "README.md")) ? readFileSync(join(dir, "README.md"), "utf8").match(/^# (.+)$/m)?.[1]?.trim() : undefined);

// Internal-only things a client must never see, whatever brand the work is for.
export const CONFIDENTIAL = [/reference library/i, /reference[_ ]emails?/i, /\bref-[0-9a-f]{10}\b/i, /\b(another|other) (client|brand)s?\b/i, /fluid'?s (past|previous) emails/i, /worked for (another|other)/i];

export type ForeignNames = { ownName: string; foreign: Map<string, string> };

export async function foreignNames(clientsDir: string, slug: string, db?: SupabaseClient): Promise<ForeignNames> {
  const ownName = title(join(clientsDir, slug)) ?? slug;
  const own = new Set([norm(ownName), norm(slug)]);
  const foreign = new Map<string, string>(); // normalized → where it comes from
  for (const d of readdirSync(clientsDir, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith("_") || d.name === slug) continue;
    for (const n of [d.name, title(join(clientsDir, d.name))]) if (n) foreign.set(norm(n), `client ${d.name}`);
  }
  if (db) {
    const [{ data: cl }, { data: refs }] = await Promise.all([db.from("clients").select("name, slug, folder"), db.from("reference_emails").select("brand")]);
    for (const c of cl ?? []) {
      if (c.folder === slug) { own.add(norm(c.name)); own.add(norm(c.slug)); continue; }
      for (const n of [c.name, c.slug, c.folder]) if (n) foreign.set(norm(n), `client ${c.slug}`);
    }
    for (const r of refs ?? []) if (r.brand) foreign.set(norm(r.brand), "reference library brand");
  }
  for (const k of [...foreign.keys()]) if (own.has(k) || k.length < 4 || [...own].some((o) => o.includes(k) || k.includes(o))) foreign.delete(k);
  return { ownName, foreign };
}

/** Problems found in `raw` (empty = clean). */
export function scanText(raw: string, names: ForeignNames): string[] {
  const out: string[] = [];
  for (const re of CONFIDENTIAL) { const m = raw.match(re); if (m) out.push(`internal-only wording "${m[0]}"`); }
  const text = norm(raw);
  for (const [name, src] of names.foreign) if (new RegExp(`(^| )${name}( |$)`).test(text)) out.push(`mentions "${name}" (${src})`);
  return out;
}
