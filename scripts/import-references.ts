// Builds the reference library: every past Fluid email design → Supabase (reference_emails + brain/references/*.webp),
// tagged by flow / campaign type / industry, with a teardown, the full copy and a Design SOP check written by Claude.
// Idempotent: keyed on the image's sha256, so re-running only fills in what's missing (pass --force to redo all).
// Usage: npm run brain:references -- [folder] [--force] [--only <substring>] [--limit N]
//        npm run brain:references -- --figma   (imports out/figma/png exports listed in out/figma/manifest.json
//        that out/figma/dedupe.json marks as new, and links matched ones to their Figma frame)
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { z } from "zod";

for (const [, k, v] of readFileSync(".env.local", "utf8").matchAll(/^([A-Z_]+)=(.*)$/gm)) process.env[k] ??= v.trim();
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const ROOT = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : join(homedir(), "Desktop/Claude Editing Assets/Email Designs");
const FORCE = process.argv.includes("--force");
const FIGMA = process.argv.includes("--figma");
const FIGMA_INDUSTRY: Record<string, string> = { Beauty: "beauty", Fashion: "apparel", Peptide: "peptides", CPG: "food", Supplement: "supplements" };
type FigmaRef = { figma_file_key: string; figma_node_id: string; figma_url: string; figma_page: string };
const figmaRef = (fileKey: string, file: string, node: string, page: string): FigmaRef => ({ figma_file_key: fileKey, figma_node_id: node, figma_url: `https://www.figma.com/design/${fileKey}/${file}?node-id=${node.replace(":", "-")}`, figma_page: page });
const MODEL = "claude-opus-5-5";
const OUT = "out/references";

// What each of Fluid's design folders tells us before Claude looks at the image.
type Hint = { flow_type?: FlowType; industry?: string; quality?: "anti_example"; figma?: FigmaRef };
const FOLDERS: Record<string, Hint> = {
  "Welcome Flow": { flow_type: "welcome" },
  "Site Abandonment": { flow_type: "site_abandonment" },
  "Browse Abandonment": { flow_type: "browse_abandonment" },
  "Abandoned checkout": { flow_type: "abandoned_cart" },
  "Post purhcase": { flow_type: "post_purchase" },
  Winback: { flow_type: "winback" },
  "Email Designs": {},
  Peptides: { industry: "peptides" },
  "Supplement email designs": { industry: "supplements" },
  "Shitty email desigs": { quality: "anti_example" },
};

const FLOW_TYPES = ["popup", "welcome", "site_abandonment", "browse_abandonment", "abandoned_cart", "post_purchase", "winback", "replenishment", "vip", "sunset", "back_in_stock"] as const;
type FlowType = (typeof FLOW_TYPES)[number];
const CAMPAIGN_TYPES = ["product", "sale", "educational", "holiday", "launch", "social_proof", "founder_story", "newsletter", "bundle", "restock"] as const;

const Check = z.object({ pass: z.boolean(), note: z.string().describe("One short line: what you saw") });
const Teardown = z.object({
  brand: z.string().nullable().describe("Brand name from the logo/footer/filename; null if unreadable"),
  industry: z.string().describe("Lowercase, one or two words: peptides, supplements, apparel, sporting goods, firearms, beauty, hair care, food, beverage, home, jewelry, pets..."),
  kind: z.enum(["flow", "campaign"]),
  flow_type: z.enum(FLOW_TYPES).nullable().describe("Required when kind=flow, else null"),
  flow_position: z.string().nullable().describe("Email number in the flow as named in the file ('1', '1A', '1v2', '3'); null for campaigns or if unknown"),
  campaign_type: z.enum(CAMPAIGN_TYPES).nullable().describe("Required when kind=campaign, else null. Pick the primary job of the email"),
  tags: z.array(z.string()).describe("4-10 lowercase retrieval tags: content angles and building blocks (e.g. 'pain-point-headline', 'comparison-table', 'reviews', 'icon-bridge', 'countdown', 'mystery-offer', 'plain-text', 'quiz-branch', 'bundle', 'ugc', 'founder', 'faq', 'free-shipping')"),
  summary: z.string().describe("2-3 sentences: what this email is trying to get the reader to do, and why its design and copy work (or, for an anti-example, why they don't)"),
  headline: z.string().describe("The hero headline, verbatim"),
  subheadline: z.string().nullable().describe("Verbatim"),
  offer: z.string().nullable().describe("The offer as stated (code, % off, free gift, mystery offer...), null if none"),
  button: z.string().nullable().describe("First CTA button text, verbatim"),
  above_the_fold: z.string().describe("Exactly what is visible in the ABOVE THE FOLD image, top to bottom"),
  sections: z
    .array(z.object({ name: z.string().describe("e.g. hero, icon bridge, benefits x3, comparison table, reviews, product grid, offer recap, FAQ, footer"), purpose: z.string(), cta: z.string().nullable().describe("Button text ending the section, verbatim, or null") }))
    .describe("Every section, top to bottom"),
  design: z.object({
    palette: z.string().describe("Main colors as hex guesses and where used"),
    typography: z.string().describe("Headline vs body treatment (serif/sans, weight, case, size relationship)"),
    buttons: z.string().describe("Shape, color, border, shadow"),
    transitions: z.string().describe("How sections flow into each other: gradients, overlaps, curves, hard blocks"),
    imagery: z.string().describe("Product shots, lifestyle, UGC, icons, infographics, tables"),
  }),
  copy: z.array(z.object({ section: z.string(), lines: z.array(z.string()).describe("Every visible line of copy in this section, verbatim, in reading order") })),
  sop: z.object({
    pain_point_headline: Check,
    cta_above_fold: Check,
    cta_within_two_sentences: Check,
    bridge_after_hero: Check.describe("Icons/infographic bridge right after the hero"),
    sets_of_three: Check,
    cta_every_section: Check,
    continuous_flow: Check.describe("Gradients/overlaps rather than blocky stops"),
    distinct_buttons: Check.describe("Large, contrasting, border and/or shadow"),
  }),
  steal: z.array(z.string()).describe("2-4 specific things a designer/copywriter should reuse from this email (for anti-examples: what to avoid)"),
});
type TeardownT = z.infer<typeof Teardown>;

const SYSTEM = `You catalogue Fluid Creatives' past email designs into a reference library that Fluid's AI strategist, copywriter and designer pull from.
Each email arrives as images at 800px wide: the first image is exactly what shows ABOVE THE FOLD on a phone/desktop preview; the rest continue the email top to bottom.
Transcribe copy verbatim (fix nothing). Judge against Fluid's Email Design SOP:

${readFileSync("knowledge/sops/email-design-sop.md", "utf8")}

Fluid's core flows: welcome (first email has versions per pop-up answer, e.g. 1A/1B/1C or 1v2/1v3), site_abandonment, browse_abandonment, abandoned_cart (includes abandoned checkout; later emails use a mystery offer), post_purchase (email 1 is often plain text), winback. Flow emails are recognisable by flow cues (welcome offers, "you left something behind", "thanks for your order", "we miss you"); if a design from a generic folder is clearly a flow email, say kind=flow.`;

async function tiles(buf: Buffer) {
  const sharp = (await import("sharp")).default;
  const W = 800;
  const img = sharp(buf).flatten({ background: "#ffffff" }).resize({ width: W });
  const { data, info } = await img.png().toBuffer({ resolveWithObject: true });
  const out: Buffer[] = [];
  const fold = Math.round((W * 700) / 600);
  const cuts = [0, Math.min(fold, info.height)];
  while (cuts[cuts.length - 1] < info.height) cuts.push(Math.min(cuts[cuts.length - 1] + 1400, info.height));
  for (let i = 0; i < cuts.length - 1 && out.length < 16; i++) {
    out.push(await sharp(data).extract({ left: 0, top: cuts[i], width: info.width, height: cuts[i + 1] - cuts[i] }).jpeg({ quality: 82 }).toBuffer());
  }
  return out;
}

async function main() {
  const sharp = (await import("sharp")).default;
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const { betaZodOutputFormat } = await import("@anthropic-ai/sdk/helpers/beta/zod");
  const { supabaseAdmin } = await import("../lib/supabase/admin");
  const db = supabaseAdmin();
  const claude = new Anthropic();
  mkdirSync(OUT, { recursive: true });

  // Collect and de-duplicate by content; a file in two folders gets both folders' hints.
  const byHash = new Map<string, { buf: Buffer; files: string[]; hint: Hint }>();
  if (FIGMA) {
    const m = JSON.parse(readFileSync("out/figma/manifest.json", "utf8"));
    const dd = JSON.parse(readFileSync("out/figma/dedupe.json", "utf8"));
    for (const it of m.items) {
      const fr = figmaRef(m.fileKey, m.file, it.node, it.page);
      const d = dd[it.node];
      if (d?.dupOfRef) {
        // Already in the library from the Desktop folders: just link it to its Figma frame (first one wins).
        const { error } = await db.from("reference_emails").update(fr).eq("ref", d.dupOfRef).is("figma_node_id", null);
        if (error) console.warn(`link ${d.dupOfRef}: ${error.message}`);
        continue;
      }
      if (d?.dupOfFigma) continue;
      const buf = readFileSync(`out/figma/png/${it.node.replace(":", "_")}.png`);
      const hash = createHash("sha256").update(buf).digest("hex");
      byHash.set(hash, { buf, files: [`figma:${m.file}/${it.page}/${it.name}`], hint: { industry: FIGMA_INDUSTRY[it.page], figma: fr } });
    }
  }
  for (const folder of FIGMA ? [] : readdirSync(ROOT)) {
    const dir = join(ROOT, folder);
    if (!statSync(dir).isDirectory()) continue;
    const hint = FOLDERS[folder];
    if (!hint) {
      console.warn(`skip folder (no mapping): ${folder}`);
      continue;
    }
    for (const f of readdirSync(dir)) {
      if (!/\.(png|jpe?g|webp)$/i.test(f)) continue;
      const buf = readFileSync(join(dir, f));
      const hash = createHash("sha256").update(buf).digest("hex");
      const e = byHash.get(hash) ?? { buf, files: [], hint: {} };
      e.files.push(`${folder}/${f}`);
      e.hint = { ...e.hint, ...Object.fromEntries(Object.entries(hint).filter(([, v]) => v)) };
      byHash.set(hash, e);
    }
  }
  let items = [...byHash.entries()];
  if (arg("only")) items = items.filter(([, e]) => e.files.some((f) => f.toLowerCase().includes(arg("only")!.toLowerCase())));
  const { data: existing } = await db.from("reference_emails").select("file_hash");
  const done = new Set((existing ?? []).map((r) => r.file_hash));
  if (!FORCE) items = items.filter(([h]) => !done.has(h));
  if (arg("limit")) items = items.slice(0, Number(arg("limit")));
  console.log(`${byHash.size} unique designs; ${items.length} to process`);

  let ok = 0;
  const failed: string[] = [];
  const queue = [...items];
  async function worker() {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const [hash, { buf, files, hint }] = next;
      const ref = `ref-${hash.slice(0, 10)}`;
      try {
        const meta = await sharp(buf).metadata();
        const parts = await tiles(buf);
        const hints = [
          `Filename(s): ${files.join(" | ")}`,
          hint.flow_type ? `Fluid filed this under the ${hint.flow_type} flow: use kind=flow, flow_type=${hint.flow_type}.` : "Fluid filed this with general designs: decide flow vs campaign from the content.",
          hint.industry ? `Industry folder: ${hint.industry}.` : "",
          hint.figma ? `From Fluid's Figma design file, page "${hint.figma.figma_page}". Frame names like "Email #1v3" mean a flow email (welcome 1, version 3); "Loyalty Flow" means flow_type vip.` : "",
          hint.quality ? "Fluid filed this as an example of a BAD email design: the summary and 'steal' list should say what's wrong with it." : "",
        ].filter(Boolean);
        const stream = claude.beta.messages.stream({
          model: MODEL,
          max_tokens: 32000,
          thinking: { type: "adaptive" },
          output_config: { effort: "medium", format: betaZodOutputFormat(Teardown) },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [
            {
              role: "user",
              content: [
                ...parts.flatMap((p, i) => [
                  { type: "text" as const, text: i === 0 ? "ABOVE THE FOLD:" : `Continued (${i}/${parts.length - 1}):` },
                  { type: "image" as const, source: { type: "base64" as const, media_type: "image/jpeg" as const, data: p.toString("base64") } },
                ]),
                { type: "text", text: hints.join("\n") },
              ],
            },
          ],
        });
        const msg = await stream.finalMessage();
        const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
        const t: TeardownT = Teardown.parse(JSON.parse(text));
        if (hint.flow_type) Object.assign(t, { kind: "flow", flow_type: hint.flow_type, campaign_type: null });
        if (t.kind === "flow" && !t.flow_type) throw new Error("flow without flow_type");
        if (t.kind === "campaign" && !t.campaign_type) throw new Error("campaign without campaign_type");

        const webp = await sharp(buf).flatten({ background: "#ffffff" }).resize({ width: Math.min(1200, meta.width ?? 1200), withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
        const path = `references/${ref}.webp`;
        const up = await db.storage.from("brain").upload(path, webp, { contentType: "image/webp", upsert: true });
        if (up.error) throw new Error(`upload: ${up.error.message}`);

        const row = {
          ref,
          brand: t.brand,
          kind: t.kind,
          flow_type: t.kind === "flow" ? t.flow_type : null,
          flow_position: t.kind === "flow" ? t.flow_position : null,
          campaign_type: t.kind === "campaign" ? t.campaign_type : null,
          industry: hint.industry ?? t.industry,
          quality: hint.quality ?? "exemplar",
          tags: t.tags,
          summary: t.summary,
          teardown: { headline: t.headline, subheadline: t.subheadline, offer: t.offer, button: t.button, above_the_fold: t.above_the_fold, sections: t.sections, design: t.design, steal: t.steal },
          copy: t.copy,
          sop_check: t.sop,
          image_path: path,
          width: meta.width,
          height: meta.height,
          source_file: files.join(" | "),
          file_hash: hash,
          ...(hint.figma ?? {}),
          updated_at: new Date().toISOString(),
        };
        const { error } = await db.from("reference_emails").upsert(row, { onConflict: "file_hash" });
        if (error) throw new Error(`db: ${error.message}`);
        writeFileSync(join(OUT, `${ref}.json`), JSON.stringify(row, null, 1));
        ok++;
        console.log(`✓ ${ref} ${row.kind === "flow" ? `${row.flow_type} #${row.flow_position ?? "?"}` : row.campaign_type} · ${row.brand ?? "?"} · ${basename(files[0])}`);
      } catch (e) {
        failed.push(`${files[0]}: ${(e as Error).message}`);
        console.error(`✗ ${files[0]}: ${(e as Error).message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Number(arg("concurrency") ?? 4) }, worker));
  console.log(`\nDone: ${ok} imported, ${failed.length} failed`);
  for (const f of failed) console.log(`  ✗ ${f}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
