// Exercises the design tools through the real agent (Dolce): layout references + product photo import.
// Usage: npx tsx bot/test-design-tools.ts   (about $0.20)
import { runAgent } from "./agent";
(async () => {
  const r = await runAgent({ folder: "dolce", clientId: "d4ced669-5ef6-4622-8be6-a92f9a607ceb", clientName: "Dolce Superfoods",
    prompt: "Tool test, don't design anything. 1) Call design_references with type educational, limit 2, and open the first image with Read; describe its layout in one line. 2) Call product_images with search 'cacao nibs', max_products 1, cutout true. Report the saved file paths and image sizes in a short list.",
    onProgress: (l) => console.log("  ·", l) });
  console.log(r.error ?? r.text, `\n(cost $${r.costUsd?.toFixed(2)}, changed ${r.changed.length} files)`);
  process.exit(0);
})();
