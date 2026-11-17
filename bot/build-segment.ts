// Build one master-sheet segment for a client from the command line.
// Usage: npx tsx bot/build-segment.ts <client-folder> "<request, e.g. engaged 120>"
import { db } from "./db";
import { buildSegment } from "../lib/klaviyo/audiences";
(async () => {
  const [folder, request] = process.argv.slice(2);
  const { data: c } = await db().from("clients").select("id").eq("folder", folder).single();
  const r = await buildSegment(db(), c!.id, request);
  console.log("error" in r ? `✗ ${r.error}` : `${r.created ? "✓ created" : "already there:"} ${r.audience.name} (${r.audience.id}) · ${r.spec.purpose}`);
  process.exit(0);
})().catch((e) => { console.error("✗", e.message); process.exit(1); });
