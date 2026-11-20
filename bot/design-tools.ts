// Design tools for the Slack agent, bound to one client:
//  - design_references: past Fluid designs of the same email type (layout ideas only). Images are saved to a
//    temp folder OUTSIDE the client folder (never committed), brand names are removed from the notes, and the
//    library is internal: it must never be mentioned to anyone.
//  - product_images: real product photos from the client's own website (Shopify), saved into the client's
//    brand/assets/products/<handle>/, optionally with the white background removed, ready to use in a design.
import { cutoffSummary, findCutoffs, findLowRes, lowResSummary } from "../lib/email/qc";
import { isRuoClient, ruoImagePromptProblem } from "../lib/compliance/ruo";
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import sharp from "sharp";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CLIENTS_DIR } from "./config";
import { db } from "./db";
import { foreignNames } from "../lib/leaks";
import { dcToHtml } from "../lib/email/dc";
import { chromium } from "playwright";

export const REF_DIR = "/tmp/fluid-refs";
const ok = (o: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(o) }] });

/** Remove a white studio background: flood-fill near-white from the edges, keep a soft edge. */
async function cutout(buf: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const seen = new Uint8Array(W * H), stack: number[] = [];
  const white = (i: number) => data[i * 4] > 249 && data[i * 4 + 1] > 249 && data[i * 4 + 2] > 249;
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (seen[i] || !white(i)) continue;
    seen[i] = 1; data[i * 4 + 3] = 0;
    const x = i % W, y = (i / W) | 0;
    if (x > 0) stack.push(i - 1); if (x < W - 1) stack.push(i + 1); if (y > 0) stack.push(i - W); if (y < H - 1) stack.push(i + W);
  }
  return sharp(data, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 2 }).png({ compressionLevel: 9 }).toBuffer();
}

export function designToolsServer(clientId: string, folder: string) {
  const references = tool(
    "design_references",
    "INTERNAL ONLY, never mention it exists. Past Fluid email designs of a given type, for layout and structure ideas (never copy their words, claims, products or brand look). Returns notes on each design's structure plus a local image path you can open with Read to see the layout. Campaign types: educational, product, holiday, social_proof, bundle, launch, sale, newsletter. Flow types: welcome, post_purchase, browse_abandonment, abandoned_cart, site_abandonment, vip, winback.",
    { type: z.string(), kind: z.enum(["campaign", "flow"]).default("campaign"), limit: z.number().int().min(1).max(6).default(4) },
    async ({ type, kind, limit }) => {
      const col = kind === "flow" ? "flow_type" : "campaign_type";
      const { data, error } = await db().from("reference_emails").select("id, ref, teardown, summary, image_path, industry, tags").eq("kind", kind).eq(col, type).neq("quality", "anti_example").limit(40);
      if (error) return ok({ error: error.message });
      const ruo = isRuoClient(join(CLIENTS_DIR, folder));
      const avatarLed = (r: any) => ruo ? ((r.tags ?? []).includes("ruo-pass") ? 2 : (r.tags ?? []).includes("ruo-hold") ? 0 : 1) : (r.tags ?? []).includes("speaks-to-avatar") ? 1 : 0; // headlines that speak to the reader's situation come first
      const picks = (data ?? []).sort(() => Math.random() - 0.5).sort((a, b) => avatarLed(b) - avatarLed(a)).slice(0, limit);
      const names = await foreignNames(CLIENTS_DIR, folder, db());
      const scrub = (s: string) => { let t = s; for (const n of names.foreign.keys()) t = t.replace(new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[\\s\\W]+")}\\b`, "gi"), "[brand]"); return t; };
      mkdirSync(REF_DIR, { recursive: true });
      const out = [];
      for (const [i, r] of picks.entries()) {
        let image: string | undefined;
        if (r.image_path) {
          const file = join(REF_DIR, `ref-${r.id.slice(0, 8)}.png`);
          if (!existsSync(file)) {
            const dl = await db().storage.from("brain").download(r.image_path);
            if (dl.data) writeFileSync(file, await sharp(Buffer.from(await dl.data.arrayBuffer())).resize({ width: 600 }).png().toBuffer());
          }
          if (existsSync(file)) image = file;
        }
        const t = r.teardown ?? {};
        out.push({ n: i + 1, image, industry: r.industry, above_the_fold: t.above_the_fold, sections: t.sections, design: t.design, reuse: t.steal, summary: r.summary });
      }
      return ok({ note: "Layout ideas only. Brand names removed. Never mention where these come from.", references: JSON.parse(scrub(JSON.stringify(out))) });
    },
  );

  // ---- Style selection: every email starts from a style picked out of the whole library, never one this client saw recently.
  const scrubber = async () => { const names = await foreignNames(CLIENTS_DIR, folder, db()); return (s: string) => { let t = s; for (const n of names.foreign.keys()) t = t.replace(new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[\\s\\W]+")}\\b`, "gi"), "[brand]"); return t; }; };
  const refImage = async (r: { id: string; image_path: string | null }) => {
    if (!r.image_path) return undefined;
    mkdirSync(REF_DIR, { recursive: true });
    const file = join(REF_DIR, `style-${r.id.slice(0, 8)}.png`);
    if (!existsSync(file)) {
      const dl = await db().storage.from("brain").download(r.image_path);
      if (dl.data) writeFileSync(file, await sharp(Buffer.from(await dl.data.arrayBuffer())).resize({ width: 600 }).png().toBuffer());
    }
    return existsSync(file) ? file : undefined;
  };
  let offered: { id: string }[] = [];
  const styleOptions = tool(
    "style_options",
    "STEP 1 of every design (internal, never mention it). Shows 3 very different past Fluid email designs to take the style direction from: hero treatment, typography, how images and products float, section shapes, color blocking. Picks from the whole library (any industry, campaigns and flows), weighted to this email's type, and never repeats a style this client got in its recent emails. Open each image with Read, then call choose_style. Call again for 3 new options if none fit.",
    { email_type: z.string().describe("e.g. educational, product, sale, holiday, launch, bundle, social_proof, winback, welcome, post_purchase"), mood: z.string().optional().describe("Optional: e.g. bold, editorial, playful, premium, minimal") },
    async ({ email_type, mood }) => {
      const [{ data: all }, { data: used }] = await Promise.all([
        db().from("reference_emails").select("id, campaign_type, flow_type, kind, industry, tags, summary, image_path, teardown").neq("quality", "anti_example").not("image_path", "is", null),
        db().from("design_style_usage").select("reference_id").eq("client_id", clientId).order("created_at", { ascending: false }).limit(40),
      ]);
      const recent = new Set((used ?? []).map((u) => u.reference_id));
      const skip = new Set([...recent, ...offered.map((o) => o.id)]);
      const pool = (all ?? []).filter((r) => !skip.has(r.id));
      const t = email_type.toLowerCase();
      const m = (mood ?? "").toLowerCase();
      const score = (r: any) => (r.campaign_type === t || r.flow_type === t ? 3 : 0) + (m && JSON.stringify(r.tags ?? []).toLowerCase().includes(m) ? 1 : 0) + Math.random() * 2.5;
      const ranked = pool.sort((a, b) => score(b) - score(a));
      // Spread the 3 picks across different industries/types so they look nothing alike.
      const picks: any[] = [];
      for (const r of ranked) { if (picks.length === 3) break; if (picks.some((p) => p.industry === r.industry && (p.campaign_type ?? p.flow_type) === (r.campaign_type ?? r.flow_type))) continue; picks.push(r); }
      offered = picks;
      const scrub = await scrubber();
      const out = [];
      for (const [i, r] of picks.entries()) {
        const d = r.teardown?.design ?? {};
        out.push({ option: i + 1, image: await refImage(r), style: d, above_the_fold: r.teardown?.above_the_fold, sections: (r.teardown?.sections ?? []).map((x: any) => (typeof x === "string" ? x : x.name ?? x.type ?? x)).slice(0, 10) });
      }
      return ok({ note: "Style direction only: never copy words, products, claims or another brand's colors/logo. Never mention where these come from.", options: JSON.parse(scrub(JSON.stringify(out))) });
    },
  );
  const chooseStyle = tool(
    "choose_style",
    "STEP 2: lock in one style option from style_options for this design. Returns its full breakdown to follow closely (adapted to this brand's fonts, colors and photos). Recorded so this client doesn't get the same style again soon.",
    { option: z.number().int().min(1).max(3), design_folder: z.string() },
    async ({ option, design_folder }) => {
      const r: any = offered[option - 1];
      if (!r) return ok({ error: "Call style_options first." });
      await db().from("design_style_usage").insert({ client_id: clientId, reference_id: r.id, design_path: design_folder });
      const scrub = await scrubber();
      return ok({ image: await refImage(r), breakdown: JSON.parse(scrub(JSON.stringify({ above_the_fold: r.teardown?.above_the_fold, sections: r.teardown?.sections, design: r.teardown?.design, what_makes_it_work: r.teardown?.steal }))) });
    },
  );
  const renderPreview = tool(
    "render_preview",
    "Render your design.dc.html exactly as it will look (600px email) and save a screenshot you can open with Read. Use it after building and after each round of fixes: compare against the chosen style and Fluid's rules, then improve.",
    { design_folder: z.string() },
    async ({ design_folder }) => {
      const base = join(CLIENTS_DIR, folder);
      const dc = join(base, design_folder.replace(/^\.\//, ""), "design.dc.html");
      if (!dc.startsWith(base + "/") || !existsSync(dc)) return ok({ error: "No design.dc.html in that folder." });
      let html: string;
      try { html = dcToHtml(dc, base); } catch (e: any) { return ok({ error: e.message }); }
      const outDir = join(REF_DIR, "previews"); mkdirSync(outDir, { recursive: true });
      const htmlFile = join(outDir, `${folder}-preview.html`); writeFileSync(htmlFile, html);
      const browser = await chromium.launch();
      try {
        const page = await browser.newPage({ viewport: { width: 600, height: 1000 }, deviceScaleFactor: 2 }); // what ships: 600 layout at 1200px
        await page.goto(`file://${htmlFile}`, { waitUntil: "load" });
        await page.evaluate(async () => { await (document as any).fonts.ready; });
        const missing = await page.evaluate(() => [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.getAttribute("src")));
        const shot = join(outDir, `${folder}-${Date.now()}.png`);
        await page.locator("body > *:first-child").screenshot({ path: shot });
        const meta = await sharp(shot).metadata();
        const cutoffs = await findCutoffs(page);
        const lowres = await findLowRes(page);
        return ok({ screenshot: shot, height: meta.height, broken_images: missing, cut_off: cutoffs.length ? cutoffs : "none found", low_resolution: lowres.length ? lowres : "none found",
          tip: (cutoffs.length ? `FIX EVERY CUT-OFF FIRST (publish_design refuses designs with cut-offs):\n${cutoffSummary(cutoffs)}\n` : "") + (lowres.length ? `These images will look soft in the 1200px export, replace them with larger ones (generate_image makes 1400px+; product photos: pick the largest original):\n${lowResSummary(lowres)}\n` : "") + "Open the screenshot with Read. Check: is it clearly in the chosen style, not a centered stack? Does every section have a visual moment? Is anything cramped, cut off, or unreadable over an image?" });
      } finally { await browser.close(); }
    },
  );

  const products = tool(
    "product_images",
    "Find products on this client's own website and save their photos into brand/assets/products/<handle>/ for use in a design (reference them in design.dc.html as src=\"asset:brand/assets/products/<handle>/<file>\"). cutout=true also saves a transparent PNG with the white background removed (good for products floating on color). Returns the saved files with sizes.",
    { search: z.string().min(2).describe("Words from the product name, e.g. 'cacao nibs'"), max_products: z.number().int().min(1).max(4).default(2), cutout: z.boolean().default(false) },
    async ({ search, max_products, cutout: doCut }) => {
      const { data: c } = await db().from("clients").select("website_url").eq("id", clientId).single();
      let site = c?.website_url as string | null;
      if (!site) {
        // Clients onboarded with just a name: the onboarding writes "Website: https://…" into onboarding/README.md or memory.md.
        for (const f of ["onboarding/README.md", "memory.md"]) {
          const p = join(CLIENTS_DIR, folder, f);
          const m = existsSync(p) ? readFileSync(p, "utf8").match(/^\W*Website\W*:\s*(https?:\/\/\S+)/im) : null;
          if (m) { site = m[1].replace(/[)*.,]+$/, ""); await db().from("clients").update({ website_url: site }).eq("id", clientId); break; }
        }
      }
      if (!site) return ok({ error: "No website on file for this client. Add a 'Website: https://…' line to memory.md." });
      const origin = new URL(site).origin;
      const all: any[] = [];
      for (let page = 1; page <= 4; page++) {
        const r = await fetch(`${origin}/products.json?limit=250&page=${page}`, { headers: { "user-agent": "Mozilla/5.0 (Fluid design agent)" } });
        if (!r.ok) break;
        const j: any = await r.json(); if (!j.products?.length) break;
        all.push(...j.products);
      }
      const words = search.toLowerCase().split(/\s+/);
      const found = all.filter((p) => words.every((w) => p.title.toLowerCase().includes(w))).slice(0, max_products);
      if (!found.length) return ok({ error: `No product matching "${search}" on ${origin}.`, some_titles: all.slice(0, 20).map((p) => p.title) });
      const saved = [];
      for (const p of found) {
        const dir = join(CLIENTS_DIR, folder, "brand/assets/products", p.handle);
        mkdirSync(dir, { recursive: true });
        const files = [];
        for (const [i, img] of (p.images ?? []).slice(0, 4).entries()) {
          const r = await fetch(`${img.src}${img.src.includes("?") ? "&" : "?"}width=1200`);
          if (!r.ok) continue;
          const buf = await sharp(Buffer.from(await r.arrayBuffer())).resize({ width: 1200, withoutEnlargement: true }).toBuffer();
          const name = `${i + 1}.jpg`;
          writeFileSync(join(dir, name), await sharp(buf).flatten({ background: "#ffffff" }).jpeg({ quality: 85 }).toBuffer());
          const meta = await sharp(buf).metadata();
          const entry: any = { file: `brand/assets/products/${p.handle}/${name}`, width: meta.width, height: meta.height, source_url: img.src };
          if (doCut) {
            const cut = await cutout(buf);
            writeFileSync(join(dir, `${i + 1}-cutout.png`), cut);
            entry.cutout = `brand/assets/products/${p.handle}/${i + 1}-cutout.png`;
          }
          files.push(entry);
        }
        saved.push({ title: p.title, handle: p.handle, url: `${origin}/products/${p.handle}`, price: p.variants?.[0]?.price, variants: (p.variants ?? []).slice(0, 4).map((v: any) => ({ title: v.title, price: v.price, id: v.id })), images: files });
      }
      return ok({ saved, tip: "Open the images with Read to choose the best shot. Cutouts only work well on plain white studio backgrounds. Pass a source_url to generate_image as a reference to put the real product into a generated scene." });
    },
  );

  let generatedThisRun = 0;
  const generate = tool(
    "generate_image",
    "Generate a photorealistic image for this email (Nano Banana Pro via Kie): recipe and lifestyle scenes, seasonal backgrounds, textures. Write a detailed photo brief: subject, setting, light, camera, mood, colors, and where to leave empty space for text. To show the brand's real product (packaging, bag, bowl) pass its photo URL in reference_urls (source_url from product_images): never invent packaging or labels without a reference. No text, logos or people's faces in the image unless asked. Saves into brand/assets/generated/ and returns the path. Max 4 per request; takes ~30-90 s each.",
    {
      prompt: z.string().min(40),
      aspect_ratio: z.enum(["16:9", "3:2", "4:3", "1:1", "4:5", "3:4", "2:3", "9:16", "21:9"]).default("3:2"),
      reference_urls: z.array(z.string().url()).max(6).optional().describe("Photos of the real product to place in the scene"),
      name: z.string().min(2).max(60).describe("Short file name, e.g. strawberry-matcha-counter"),
    },
    async ({ prompt, aspect_ratio, reference_urls, name }) => {
      const key = process.env.KIE_API_KEY;
      if (!key) return ok({ error: "Image generation isn't set up (KIE_API_KEY missing)." });
      if (isRuoClient(join(CLIENTS_DIR, folder))) { const why = ruoImagePromptProblem(prompt); if (why) return ok({ error: why }); }
      if (generatedThisRun >= 4) return ok({ error: "Limit of 4 generated images per request reached." });
      generatedThisRun++;
      const kie = async (path: string, init?: RequestInit) => {
        const r = await fetch(`https://api.kie.ai${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } });
        const b: any = await r.json().catch(() => ({ code: r.status, msg: r.statusText }));
        if (b.code !== 200) throw new Error(`Kie ${b.code}: ${b.msg || "request failed"}`);
        return b.data;
      };
      try {
        const input: Record<string, unknown> = { prompt: `${prompt}\n\nPhotorealistic, natural light, high detail, no text, no watermark.`, aspect_ratio, resolution: "2K", output_format: "jpg" };
        if (reference_urls?.length) input.image_input = reference_urls;
        const { taskId } = await kie("/api/v1/jobs/createTask", { method: "POST", body: JSON.stringify({ model: "nano-banana-pro", input }) });
        for (let i = 0; i < 60; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          const d = await kie(`/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`);
          if (d.state === "fail") return ok({ error: d.failMsg || "Generation failed" });
          if (d.state !== "success") continue;
          const url = ((d.resultJson ? JSON.parse(d.resultJson) : d.response || {}).resultUrls || [])[0];
          if (!url) return ok({ error: "No image came back" });
          const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
          const dir = join(CLIENTS_DIR, folder, "brand/assets/generated");
          mkdirSync(dir, { recursive: true });
          const file = `${new Date().toISOString().slice(0, 10)}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.jpg`;
          const out = await sharp(buf).resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toBuffer(); // 1200px export of a full-bleed scene needs ≥1200px; keep headroom for crops
          writeFileSync(join(dir, file), out);
          const meta = await sharp(out).metadata();
          return ok({ file: `brand/assets/generated/${file}`, width: meta.width, height: meta.height, tip: "Open it with Read to check it before using it." });
        }
        return ok({ error: "Timed out waiting for the image" });
      } catch (e: any) { return ok({ error: e.message }); }
    },
  );

  return createSdkMcpServer({ name: "fluid_design", version: "1.0.0", tools: [styleOptions, chooseStyle, renderPreview, references, products, generate] });
}

export const DESIGN_TOOLS = ["mcp__fluid_design__style_options", "mcp__fluid_design__choose_style", "mcp__fluid_design__render_preview", "mcp__fluid_design__design_references", "mcp__fluid_design__product_images", "mcp__fluid_design__generate_image"];
