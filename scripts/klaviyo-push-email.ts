// Slices a finished design into a Klaviyo email and (with --push) creates it in the client's Klaviyo as a DRAFT.
// Never sends or schedules (lib/klaviyo/push-email.ts → lib/klaviyo/write.ts: drafts only, per-client permission).
// Usage: npx tsx scripts/klaviyo-push-email.ts <client-folder> <design-folder> [--push] [--code] [--new-campaign]
//   Drag-and-drop template by default; --code = custom HTML. Re-pushing reuses the design's draft unless --new-campaign.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { pushEmail } from "../lib/klaviyo/push-email";

for (const [, k, v] of readFileSync(join(__dirname, "../.env.local"), "utf8").matchAll(/^([A-Z_]+)=(.*)$/gm)) process.env[k] ??= v.trim();
const [folder, designRel] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!folder || !designRel) throw new Error("Usage: klaviyo-push-email.ts <client-folder> <design-folder> [--push]");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
pushEmail({ clientsDir: resolve(__dirname, "../clients"), folder, designRel, db, push: process.argv.includes("--push"), code: process.argv.includes("--code"), newCampaign: process.argv.includes("--new-campaign"), log: console.log })
  .then((r) => console.log(r.pushed ? `\nIn Klaviyo (draft, not scheduled):\n${JSON.stringify(r.klaviyo, null, 2)}` : `\nPreview: ${r.preview}\nQC sheet: ${r.qcPng}\nDry run: nothing sent to Klaviyo. Add --push to create the draft.`))
  .catch((e) => { console.error(e.message ?? e); process.exit(1); });
