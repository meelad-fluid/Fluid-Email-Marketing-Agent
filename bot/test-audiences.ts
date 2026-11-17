// Audience search self-test against a client's real Klaviyo lists/segments (read-only).
// Usage: npx tsx bot/test-audiences.ts [query...]
import { db } from "./db";
import { allAudiences, pick, rank } from "../lib/klaviyo/audiences";
(async () => {
  const all = await allAudiences(db(), "d4ced669-5ef6-4622-8be6-a92f9a607ceb");
  const qs = process.argv.slice(2).length ? process.argv.slice(2) : ["engaged 120", "Engaged 120 list", "90 day engaged", "180 engaged", "black friday early access", "wholesale", "VIP"];
  for (const q of qs) console.log(JSON.stringify(q).padEnd(28), "→", pick(q, all)?.name ?? "(no clear match)", "| top:", rank(q, all).slice(0, 3).map((r) => `${r.name} [${r.score}]`).join(" · "));
  process.exit(0);
})();
