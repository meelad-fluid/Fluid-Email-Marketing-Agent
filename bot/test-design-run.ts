// Full design run through the real agent (Dolce): style pick → imagery → build → render/critique → publish.
// Usage: PUBLIC_URL=https://<railway-domain> npx tsx bot/test-design-run.ts "<request>"
import { runAgent } from "./agent";
(async () => {
  const prompt = process.argv[2] ?? "Design the Nov 20 campaign 'Nibs, powder or butter' from the Black Friday strategy (strategy/2026-11-16-bfcm-strategy.md #3). Write the copy into copy/ first (short, Fluid copy rules), then design it.";
  const r = await runAgent({ folder: "dolce", clientId: "d4ced669-5ef6-4622-8be6-a92f9a607ceb", clientName: "Dolce Superfoods", prompt, onProgress: (l) => console.log("  ·", l) });
  console.log("\n" + (r.error ?? r.text), `\n(cost $${r.costUsd?.toFixed(2)}, changed ${r.changed.length} files)`);
  process.exit(0);
})();
