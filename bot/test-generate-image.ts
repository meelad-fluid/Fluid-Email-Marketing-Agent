// Exercises generate_image through the real agent (Dolce). Needs KIE_API_KEY in the environment.
// Usage: KIE_API_KEY=... npx tsx bot/test-generate-image.ts
import { runAgent } from "./agent";
(async () => {
  const r = await runAgent({ folder: "dolce", clientId: "d4ced669-5ef6-4622-8be6-a92f9a607ceb", clientName: "Dolce Superfoods",
    prompt: "Tool test, don't design an email. Call product_images for 'ceremonial matcha' (max 1 product, no cutout), then call generate_image once: a realistic iced strawberry matcha latte in a tall clear glass on a light marble kitchen counter, pink strawberry layer under the green matcha, a few fresh strawberries and a small bowl of matcha powder beside it, soft morning window light, shallow depth of field, empty space on the left for a headline, aspect 3:2, using the matcha product photo's source_url as a reference for the powder. Open the result with Read and tell me in one sentence how realistic it looks, plus the file path.",
    onProgress: (l) => console.log("  ·", l) });
  console.log(r.error ?? r.text, `\n(cost $${r.costUsd?.toFixed(2)})`);
  process.exit(0);
})();
