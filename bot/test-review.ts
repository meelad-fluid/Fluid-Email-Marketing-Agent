// Review-link self-test: publishes a Dolce design, opens the page in a browser, leaves a pinned comment, checks assets and path safety.
process.env.PORT = "8090"; process.env.PUBLIC_URL = "http://localhost:8090";
import { publishDesign } from "./review";
import { startWeb } from "./web";
import { chromium } from "playwright";
(async () => {
  startWeb(async (_c, _t, text) => { console.log("[slack notify]", text.split("\n")[0]); });
  const r = await publishDesign({ clientId: "d4ced669-5ef6-4622-8be6-a92f9a607ceb", folder: "dolce", designPath: "designs/2026-12-03-matcha-winback-20", note: "first version" });
  console.log("link", r.url, "version", r.version);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on("dialog", (d) => d.accept(d.type() === "prompt" ? "Test Reviewer" : undefined));
  await p.goto(r.url); await p.waitForTimeout(2500);
  await p.screenshot({ path: "/private/tmp/claude-501/-Users-meeladzarrabi/a0e3d6ee-d124-4ce4-95c2-f501e5130077/scratchpad/review-1.png" });
  // leave a pinned comment on the hero
  const ov = await p.locator("#ov").boundingBox();
  await p.mouse.click(ov!.x + 300, ov!.y + 200);
  await p.fill("#ctext", "Test comment: make the headline a bit smaller");
  await p.click("#csave"); await p.waitForTimeout(1500);
  await p.screenshot({ path: "/private/tmp/claude-501/-Users-meeladzarrabi/a0e3d6ee-d124-4ce4-95c2-f501e5130077/scratchpad/review-2.png" });
  const data = await (await fetch(r.url + "/data")).json();
  console.log("comments:", data.comments.length, data.comments[0]?.x, data.comments[0]?.y, "| assets 404s:", "checking");
  const html = await (await fetch(r.url + "/frame")).text();
  const assets = [...new Set([...html.matchAll(/\/r\/[^"')]+\/assets\/[^"')]+/g)].map((m) => m[0]))];
  for (const a of assets) { const s = (await fetch("http://localhost:8090" + a)).status; if (s !== 200) console.log("asset", s, a); }
  console.log("assets checked:", assets.length);
  const trav = (await fetch(r.url + "/assets/../../arq8/memory.md")).status; const trav2 = (await fetch(r.url + "/assets/%2e%2e/%2e%2e/.env.local")).status;
  console.log("traversal blocked:", trav, trav2, "| bad token:", (await fetch("http://localhost:8090/r/notarealtoken1234567")).status);
  await b.close(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
