// Email QC: Fluid's copy + design checklist, run on every design before its review link is published.
// The renderer measures what code can measure exactly (where the first button sits, text sizes, the
// headline, where the offer shows, off-brand colors); a Claude reviewer reads the screenshots and the copy
// as a stranger opening the email and grades each checklist point. publish_design refuses anything that
// doesn't pass and sends the fixes back to the designer, who fixes and publishes again (the re-run).
//
// Copy checklist (Meelad, 2026-11-26):
//   third-grade reading level · easy to understand · makes sense to a stranger with a clear next step ·
//   talks to the brand's avatars · achieves the email's goal · straight to the point, not cute or clever
// Design checklist:
//   clear headline · CTA above the fold · fonts easy to read on mobile · discount clear at a glance ·
//   colors aligned to the brand · no random or misplaced badges
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { dcToHtml } from "./dc";
import { usedColors } from "./qc";
import { emailText } from "../compliance/ruo";
import { offBrandColors } from "../library/store";

export const QC_CHECKS = {
  copy_reading_level: "Copy: written at a third-grade reading level (short common words, short sentences)",
  copy_easy: "Copy: easy to understand on the first read",
  copy_cold_reader: "Copy: a stranger with no context gets it and knows exactly what to do next",
  copy_avatar: "Copy: talks to the brand's avatar (their situation, their words)",
  copy_goal: "Copy: achieves the email's goal",
  copy_straight: "Copy: straight to the point, not cute, clever or beating around the bush",
  design_headline: "Design: there is a clear headline",
  design_cta_fold: "Design: a CTA button is above the fold",
  design_mobile_fonts: "Design: fonts are easy to read on a phone",
  design_discount: "Design: if there's a discount, it's clear and seen immediately",
  design_brand_colors: "Design: colors are aligned to the brand",
  design_badges: "Design: no random or misplaced badges",
} as const;
export type QcId = keyof typeof QC_CHECKS;

const Check = z.object({ pass: z.boolean(), problem: z.string().describe("Empty when it passes. Otherwise what's wrong, quoting the exact line or naming the exact element."), fix: z.string().describe("Empty when it passes. Otherwise the concrete change, e.g. the rewritten line.") });
const Verdict = z.object({
  goal: z.string().describe("The one action this email exists to get, in a few words (e.g. 'finish the checkout')"),
  checks: z.object(Object.fromEntries(Object.keys(QC_CHECKS).map((k) => [k, Check])) as Record<QcId, typeof Check>),
});
export type QcCheck = z.infer<typeof Check> & { id: QcId; label: string };
export type QcResult = { pass: boolean; goal: string; failed: QcCheck[]; checks: QcCheck[] };

const FOLD = 650; // design-rules §1: the button sits within roughly the first 650px of the 600px email
const PHONE = 390; // a 600px email shown on a phone is scaled to about 390px wide

type Facts = {
  height: number;
  buttons: { text: string; top: number; bottom: number }[];
  firstLink: { text: string; bottom: number } | null;
  headline: { text: string; size: number; top: number } | null;
  smallText: { size: number; text: string; top: number }[];
  offer: { text: string; size: number; top: number }[];
};

export async function measure(page: import("playwright").Page): Promise<Facts> {
  await page.evaluate("window.__name = window.__name || ((f) => f)");
  return page.evaluate((FOLD) => {
    const root = document.body.firstElementChild as HTMLElement;
    const R = root.getBoundingClientRect();
    const clean = (t: string | null) => (t || "").trim().replace(/\s+/g, " ");
    const transparent = (c: string) => /rgba\(.*,\s*0\)|transparent/.test(c);
    const buttons: { text: string; top: number; bottom: number }[] = [];
    let firstLink: { text: string; bottom: number } | null = null;
    for (const a of Array.from(root.querySelectorAll<HTMLElement>("a"))) {
      const r = a.getBoundingClientRect(), t = clean(a.textContent);
      if (r.width && t && !firstLink) firstLink = { text: t.slice(0, 60), bottom: Math.round(r.bottom - R.top) };
    }
    // A button: a filled or outlined box of tappable size with short text, that is a link or sits inside one
    // (a hero wrapped in one link with a button-styled span inside still taps through once it's sliced).
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      if (!el.closest("a")) continue;
      const s = getComputedStyle(el), br = el.getBoundingClientRect(), t = clean(el.textContent);
      if (!t || t.length > 60 || br.height < 30 || br.height > 140 || br.width >= R.width * 0.98) continue;
      const filled = !transparent(s.backgroundColor) || s.backgroundImage !== "none";
      if (!filled && (parseFloat(s.borderTopWidth) < 1 || /dashed|dotted/.test(s.borderTopStyle))) continue; // dashed outlines are code pills
      if (buttons.some((b) => b.text === t && Math.abs(b.top - (br.top - R.top)) < 40)) continue;
      buttons.push({ text: t, top: Math.round(br.top - R.top), bottom: Math.round(br.bottom - R.top) });
    }
    // Text sizes, the headline (largest text near the top) and where an offer appears.
    const smallText: { size: number; text: string; top: number }[] = [];
    const offer: { text: string; size: number; top: number }[] = [];
    let headline: { text: string; size: number; top: number } | null = null;
    const seen = new Set<Element>();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement!, t = clean(n.textContent);
      if (!t || seen.has(el)) continue;
      seen.add(el);
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || s.display === "none" || +s.opacity === 0) continue;
      const r = el.getBoundingClientRect(); if (!r.width) continue;
      const size = parseFloat(s.fontSize), top = Math.round(r.top - R.top), full = clean(el.textContent);
      if (size < 15 && full.length >= 20) smallText.push({ size, text: full.slice(0, 70), top });
      if (top < FOLD + 150 && (!headline || size > headline.size)) headline = { text: full.slice(0, 90), size, top };
      if (/\d+\s?%|\$\s?\d+(\.\d+)?\s?off|\bfree shipping\b|\bBOGO\b|\bbuy one\b|\bcode\b|\bfree gift\b|\bsave \$?\d+/i.test(full) && offer.length < 6) offer.push({ text: full.slice(0, 70), size, top });
    }
    return { height: Math.round(R.height), buttons: buttons.slice(0, 8), firstLink, headline, smallText: smallText.slice(0, 15), offer };
  }, FOLD);
}

/** Copy-file lines the reviewer needs: subject/preview, who it's for, the offer, the idea. */
function copyContext(designDir: string, clientDir: string): string {
  const readme = join(designDir, "README.md");
  if (!existsSync(readme)) return "";
  const r = readFileSync(readme, "utf8");
  const title = r.split("\n")[0].replace(/^#\s*/, "");
  const rel = r.match(/\*\*Copy:\*\*\s*`([^`]+)`/)?.[1] ?? r.match(/^Copy:\s*(\S+)/m)?.[1];
  const file = rel ? resolve(designDir, rel) : "";
  const lines: string[] = [`Email: ${title}`];
  if (file && file.startsWith(clientDir + sep) && existsSync(file)) {
    for (const l of readFileSync(file, "utf8").split("\n").slice(0, 40))
      if (/^(SUBJECT|PREVIEW)|^\*\*(Talking to|Idea)|^- \*\*(Email Campaign name|Flow|Offer|Format|Goal|Sent to)/i.test(l)) lines.push(l);
  } else {
    for (const l of r.split("\n")) if (/Talking to|Idea:/i.test(l)) lines.push(l);
  }
  return lines.join("\n");
}

function avatars(clientDir: string): string {
  const f = join(clientDir, "research", "customer-research.md");
  return existsSync(f) ? readFileSync(f, "utf8").slice(0, 7000) : "(no customer research doc yet: judge the avatar from the Talking to line and the brand)";
}

const anthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Run the checklist on a design. Throws only if the email can't be rendered or reviewed at all. */
export async function qcEmail(o: { dcPath: string; clientDir: string; brandColors?: { name: string; hex: string }[] | null; ruo?: boolean; model?: string }): Promise<QcResult> {
  const { chromium } = await import("playwright");
  const html = dcToHtml(o.dcPath, o.clientDir);
  const file = join(mkdtempSync(join(tmpdir(), "fluid-review-qc-")), "email.html");
  writeFileSync(file, html);
  const browser = await chromium.launch();
  let facts: Facts, shot: Buffer, offBrand: { hex: string; where: string[] }[] | null = null;
  try {
    const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
    await page.goto(`file://${file}`, { waitUntil: "load" });
    await page.evaluate(async () => { await (document as any).fonts.ready; });
    facts = await measure(page);
    if (o.brandColors?.length) offBrand = offBrandColors(await usedColors(page), o.brandColors.map((c) => c.hex));
    shot = await page.locator("body > *:first-child").screenshot();
  } finally { await browser.close(); }

  // Images for the reviewer: the first screen as a phone shows it, then the whole email in readable tiles.
  const meta = await sharp(shot).metadata();
  const W = meta.width!, H = meta.height!;
  const png = (b: Buffer) => ({ type: "image" as const, source: { type: "base64" as const, media_type: "image/png" as const, data: b.toString("base64") } });
  const phone = await sharp(shot).extract({ left: 0, top: 0, width: W, height: Math.min(H, Math.round(FOLD * (W / 600))) }).resize({ width: PHONE }).png().toBuffer();
  const tileH = Math.round(1100 * (W / 600)), tiles: Buffer[] = [];
  for (let top = 0; top < H && tiles.length < 8; top += tileH) tiles.push(await sharp(shot).extract({ left: 0, top, width: W, height: Math.min(tileH, H - top) }).png().toBuffer());

  const fold = facts.buttons.filter((b) => b.bottom <= FOLD);
  const factLines = [
    `Email height: ${facts.height}px (600px wide). The fold is the first ${FOLD}px.`,
    `Buttons (top–bottom px): ${facts.buttons.length ? facts.buttons.map((b) => `"${b.text}" ${b.top}–${b.bottom}`).join("; ") : "none found"}.`,
    `Button fully above the fold: ${fold.length ? `yes ("${fold[0].text}")` : "NO"}. First link of any kind ends at ${facts.firstLink ? `${facts.firstLink.bottom}px ("${facts.firstLink.text}")` : "none"}.`,
    `Largest text near the top (likely headline): ${facts.headline ? `"${facts.headline.text}" at ${facts.headline.size}px, ${facts.headline.top}px down` : "none"}.`,
    `Text blocks under 15px at 600px wide (≈${Math.round(15 * PHONE / 600)}px on a phone): ${facts.smallText.length ? facts.smallText.map((t) => `${t.size}px at ${t.top}px "${t.text}"`).join("; ") : "none"}.`,
    `Offer mentions: ${facts.offer.length ? facts.offer.map((t) => `"${t.text}" ${t.size}px at ${t.top}px`).join("; ") : "none found"}.`,
    o.brandColors?.length ? `Brand palette: ${o.brandColors.map((c) => `${c.name} ${c.hex}`).join(", ")}. Colors not in it (neutrals and tints already excluded): ${offBrand?.length ? offBrand.map((c) => `${c.hex} (${c.where.join("; ")})`).join(" | ") : "none"}.` : "No brand book on file: judge colors against the brand's look in the email (logo, product, packaging).",
  ].join("\n");

  const system = `You are the QC reviewer at Fluid Creatives, an email marketing agency. You check one finished marketing email against Fluid's checklist before the client sees it. Be strict: a check passes only if a busy, distracted reader on a phone would agree. But don't invent problems: if a check is met, pass it.

Read it twice: once as the brand's ideal customer, once as a random stranger with no context who opened it on their phone.

COPY
- copy_reading_level: a third grader could read it. Short everyday words, short sentences. Brand and product names and the trade's own common words are fine. Fail long or abstract sentences and words like "elevate", "curated", "unparalleled", "synergy".
- copy_easy: every line makes sense on the first read; nothing needs a second look.
- copy_cold_reader: a stranger with no context knows what this is, what's being offered and exactly what to do next.
- copy_avatar: it speaks to the brand's avatar (their situation, their moment, their words), not to "anyone".
- copy_goal: every part of the email pushes toward its one goal; nothing pulls away from it.
- copy_straight: says it plainly. Fail cute, clever, metaphor-first or beat-around-the-bush lines where a plain one works better. Example: for an abandoned checkout (goal: get them back to checkout), "You were almost at the finish line, let's cross that" FAILS; "Your order is ALMOST complete" passes. Simple and straight to the point beats smart.

DESIGN
- design_headline: there is one clear headline that reads first and says the point.
- design_cta_fold: a CTA button is fully visible in the first ${FOLD}px (the measured facts say whether one is). Plain-text founder notes pass with a clear link in the first screen.
- design_mobile_fonts: on the phone-size image every word is easy to read. Body text should be at least 15px in the 600px design; only legal/footer text may be smaller (but not below 11px). Also fail thin or script fonts used for important text, and text with poor contrast over images or colors.
- design_discount: if there's a discount, code or deal, you see it within a second (big, high contrast, in the first screen). If there's no offer at all, pass and say "no offer".
- design_brand_colors: the colors match the brand; nothing looks like it came from another brand.
- design_badges: no badge, sticker, pill, stamp or label that is random, meaningless, overlapping something important, floating oddly or repeated for no reason.
${o.ruo ? "\nThis is a research-use-only peptide brand: the avatar is the research buyer (procurement, documentation, purity, shipping). Copy must never imply human use, a body benefit or a dose; fail copy_avatar if it does.\n" : ""}
For each failed check, quote the exact line or name the exact element, and give a concrete fix (for copy, write the replacement line in the brand's voice). Keep each problem and fix to one or two sentences.`;

  const user = `Brand customer research (who the avatars are):\n<<<\n${avatars(o.clientDir)}\n>>>\n\nAbout this email:\n${copyContext(dirname(o.dcPath), o.clientDir) || "(no copy file found)"}\n\nMeasured facts:\n${factLines}\n\nAll text in the email:\n<<<\n${emailText(html).replace(/\n\s*\n+/g, "\n").slice(0, 9000)}\n>>>\n\nImage 1 is the first screen as it shows on a phone (${PHONE}px wide). Images 2+ are the full email from top to bottom at 600px.`;

  const r = await anthropic().messages.parse({
    model: o.model ?? process.env.FLUID_BOT_QC_MODEL ?? "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: "medium", format: zodOutputFormat(Verdict) },
    system,
    messages: [{ role: "user", content: [png(phone), ...tiles.map(png), { type: "text", text: user }] }],
  });
  const v = r.parsed_output;
  if (!v) throw new Error(`QC reviewer gave no verdict (stop: ${r.stop_reason})`);
  const checks: QcCheck[] = (Object.keys(QC_CHECKS) as QcId[]).map((id) => ({ id, label: QC_CHECKS[id], ...v.checks[id] }));
  // A measured fact wins over the reviewer's eye: no button or link inside the fold is a fail.
  const cta = checks.find((c) => c.id === "design_cta_fold")!;
  if (!fold.length && !(facts.firstLink && facts.firstLink.bottom <= FOLD) && cta.pass) Object.assign(cta, { pass: false, problem: `No button ends inside the first ${FOLD}px${facts.buttons[0] ? ` (the first one, "${facts.buttons[0].text}", ends at ${facts.buttons[0].bottom}px)` : ""}.`, fix: "Move the button up under the headline/subheadline; put the hero image behind the text or after the button." });
  const failed = checks.filter((c) => !c.pass);
  return { pass: failed.length === 0, goal: v.goal, failed, checks };
}

export const qcSummary = (q: QcResult) => q.failed.map((c) => `- ${c.label}: ${c.problem} Fix: ${c.fix}`).join("\n");
