// Renders an existing review link at phone and desktop widths and checks there is no sideways scroll.
// Usage: npx tsx bot/test-review-mobile.ts <token>
process.env.PORT = "8091";
import { startWeb } from "./web";
import { chromium, devices } from "playwright";
(async () => {
  const token = process.argv[2];
  startWeb(async () => {});
  await new Promise((r) => setTimeout(r, 500));
  const b = await chromium.launch();
  for (const [name, ctxOpts] of [["iphone", devices["iPhone 14"]], ["desktop", { viewport: { width: 1280, height: 900 } }]] as const) {
    const ctx = await b.newContext(ctxOpts as any); const p = await ctx.newPage();
    await p.goto(`http://localhost:8091/r/${token}`); await p.waitForTimeout(2500);
    const o = await p.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, fitW: document.getElementById("fit")!.getBoundingClientRect().width, fitLeft: document.getElementById("fit")!.getBoundingClientRect().left }));
    console.log(name, JSON.stringify(o), o.scrollW > o.clientW ? "✗ sideways scroll" : "✓ no sideways scroll");
    await p.screenshot({ path: `/private/tmp/claude-501/-Users-meeladzarrabi/a0e3d6ee-d124-4ce4-95c2-f501e5130077/scratchpad/review-${name}.png` });
    await ctx.close();
  }
  await b.close(); process.exit(0);
})();
