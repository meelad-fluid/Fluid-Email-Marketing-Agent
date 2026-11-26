// Cut-off check for a rendered email. Finds images and text that the reader won't fully see:
//   - images pushed past the email's 600px edge or past a box that hides overflow (e.g. a jar half off the side)
//   - text clipped by a box or by the email edge
//   - gradient text (background-clip:text) with tight line-height, which cuts the tops/bottoms off the letters
// Used by render_preview (the designer fixes what it reports) and before a design is published for review.
import type { Page } from "playwright";

export type Cutoff = { kind: "image" | "text" | "gradient-text"; what: string; hidden: string; fix: string };

export async function findCutoffs(page: Page): Promise<Cutoff[]> {
  await page.evaluate("window.__name = window.__name || ((f) => f)"); // tsx/esbuild helper used inside the function below
  return page.evaluate(() => {
    const root = document.body.firstElementChild as HTMLElement;
    const out: { kind: "image" | "text" | "gradient-text"; what: string; hidden: string; fix: string }[] = [];
    if (!root) return out;
    const R = root.getBoundingClientRect();
    const label = (el: Element) => {
      const src = el.getAttribute("src");
      if (src) return `image ${src.split("/").pop()?.split("?")[0]}`;
      const t = (el.textContent || "").trim().replace(/\s+/g, " ");
      return `"${t.slice(0, 50)}${t.length > 50 ? "…" : ""}"`;
    };
    // The visible window for an element: the email edge intersected with every overflow-hiding ancestor.
    const clipFor = (el: Element) => {
      let c = { l: R.left, t: -1e9, r: R.right, b: 1e9 }; // the email's sides always cut; height grows with content
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (/(hidden|clip)/.test(s.overflowX + s.overflow)) { const r = a.getBoundingClientRect(); c = { ...c, l: Math.max(c.l, r.left), r: Math.min(c.r, r.right) }; }
        if (/(hidden|clip)/.test(s.overflowY + s.overflow)) { const r = a.getBoundingClientRect(); c = { ...c, t: Math.max(c.t, r.top), b: Math.min(c.b, r.bottom) }; }
      }
      return c;
    };
    const hiddenShare = (r: DOMRect, c: { l: number; t: number; r: number; b: number }) => {
      const w = Math.max(0, Math.min(r.right, c.r) - Math.max(r.left, c.l)), h = Math.max(0, Math.min(r.bottom, c.b) - Math.max(r.top, c.t));
      return r.width * r.height ? 1 - (w * h) / (r.width * r.height) : 0;
    };
    const sides = (r: DOMRect, c: { l: number; t: number; r: number; b: number }, tol: number) =>
      [r.left < c.l - tol && "left", r.right > c.r + tol && "right", r.top < c.t - tol && "top", r.bottom > c.b + tol && "bottom"].filter(Boolean).join(", ");

    // Images (rotated images use their bounding box, so allow a little slack for transparent corners).
    for (const img of Array.from(root.querySelectorAll("img"))) {
      const r = img.getBoundingClientRect();
      if (r.width < 24 || r.height < 24) continue;
      const c = clipFor(img), share = hiddenShare(r, c), side = sides(r, c, 10);
      if (share > 0.06 && side) out.push({ kind: "image", what: label(img), hidden: `${Math.round(share * 100)}% cut off on the ${side}`, fix: "Move it fully inside the email (or its section), or make it smaller. Product shots must be fully visible; only plain background texture may bleed off an edge." });
    }

    // Text: every text node's own box against its visible window.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const seen = new Set<Element>();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement!;
      if (!(n.textContent || "").trim() || seen.has(el)) continue;
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || s.display === "none" || +s.opacity === 0) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      const r = range.getBoundingClientRect();
      if (!r.width) continue;
      const side = sides(r, clipFor(el), 2);
      if (side) { seen.add(el); out.push({ kind: "text", what: label(el), hidden: `cut off on the ${side}`, fix: "Give the text room: smaller size, more width, or move it inside its box." }); }
    }

    // Gradient-filled text paints only inside its line box, so tight line-height chops the letters.
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      const s = getComputedStyle(el);
      if (!/text/.test((s as any).webkitBackgroundClip || s.backgroundClip || "")) continue;
      const fs = parseFloat(s.fontSize), lh = s.lineHeight === "normal" ? fs * 1.2 : parseFloat(s.lineHeight);
      if (lh / fs < 1.15) out.push({ kind: "gradient-text", what: label(el), hidden: `line-height ${(lh / fs).toFixed(2)} cuts the tops and bottoms of the letters`, fix: "Set line-height to at least 1.2 and add a little vertical padding (e.g. padding:.08em 0), or use solid color." });
    }
    return out;
  });
}

export const cutoffSummary = (c: Cutoff[]) => c.map((x) => `- ${x.what}: ${x.hidden}. Fix: ${x.fix}`).join("\n");

/** Render a design.dc.html at 600px and return what's cut off (empty = clean). */
export async function checkDesignCutoffs(dcPath: string, clientDir: string): Promise<Cutoff[]> {
  const { chromium } = await import("playwright");
  const { dcToHtml } = await import("./dc");
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const file = join(mkdtempSync(join(tmpdir(), "fluid-qc-")), "email.html");
  writeFileSync(file, dcToHtml(dcPath, clientDir));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 600, height: 1000 } });
    await page.goto(`file://${file}`, { waitUntil: "load" });
    await page.evaluate(async () => { await (document as any).fonts.ready; });
    return await findCutoffs(page);
  } finally { await browser.close(); }
}

/** Images too small to be sharp in the 1200px (2x) export: natural size below ~1.8x the size they're shown at. */
export type LowRes = { what: string; shown: string; has: string; fix: string };
export async function findLowRes(page: Page): Promise<LowRes[]> {
  await page.evaluate("window.__name = window.__name || ((f) => f)");
  return page.evaluate(async () => {
    const root = document.body.firstElementChild as HTMLElement;
    const out: { what: string; shown: string; has: string; fix: string }[] = [];
    if (!root) return out;
    const name = (src: string) => decodeURIComponent(src.split("/").pop()?.split("?")[0] ?? src).slice(0, 60);
    const need = 1.8; // 2x export, with a little slack
    for (const img of Array.from(root.querySelectorAll("img"))) {
      const r = img.getBoundingClientRect();
      if (r.width < 60 || !img.naturalWidth || /\.svg(\?|$)/i.test(img.src)) continue;
      if (img.naturalWidth < r.width * need) out.push({ what: `image ${name(img.src)}`, shown: `${Math.round(r.width)}px wide`, has: `${img.naturalWidth}px`, fix: `Needs about ${Math.round(r.width * 2)}px wide: use a larger original or regenerate it.` });
    }
    // Background images (heroes, full-bleed scenes): "cover" needs the image to cover the box at 2x.
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (!m || /\.svg|data:image\/svg/i.test(m[1])) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 80) continue;
      const im = new Image(); im.src = m[1];
      try { await im.decode(); } catch { continue; }
      const scale = Math.max((r.width * need) / im.naturalWidth, (r.height * need) / im.naturalHeight);
      if (scale > 1.05) out.push({ what: `background ${name(m[1])}`, shown: `${Math.round(r.width)}×${Math.round(r.height)}px box`, has: `${im.naturalWidth}×${im.naturalHeight}px`, fix: `Needs about ${Math.round(r.width * 2)}×${Math.round(r.height * 2)}px to stay sharp: regenerate it larger or use a bigger original.` });
    }
    return out;
  });
}
export const lowResSummary = (l: LowRes[]) => l.map((x) => `- ${x.what}: shown at ${x.shown}, only ${x.has}. ${x.fix}`).join("\n");

/** Every solid color the design paints (text, backgrounds, borders, gradient stops), with where it's used. */
export async function usedColors(page: Page) {
  await page.evaluate("window.__name = window.__name || ((f) => f)");
  return page.evaluate(() => {
    const out: { hex: string; where: string }[] = [];
    const root = document.body.firstElementChild;
    if (!root) return out;
    const toHex = (c: string) => { const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); if (!m || (m[4] !== undefined && +m[4] < 0.35)) return null; return "#" + [m[1], m[2], m[3]].map((x) => Math.round(+x).toString(16).padStart(2, "0")).join(""); };
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      if (!r.width || !r.height || s.visibility === "hidden" || +s.opacity === 0) continue;
      const what = `${el.tagName.toLowerCase()}${(el.textContent || "").trim() ? ` "${(el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30)}"` : ""}`;
      const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent || "").trim());
      if (hasText) { const h = toHex(s.color); if (h) out.push({ hex: h, where: `text of ${what}` }); }
      const bg = toHex(s.backgroundColor); if (bg) out.push({ hex: bg, where: `background of ${what}` });
      if (parseFloat(s.borderTopWidth) >= 2) { const b = toHex(s.borderTopColor); if (b) out.push({ hex: b, where: `border of ${what}` }); }
      for (const g of s.backgroundImage.match(/rgba?\([^)]+\)/g) ?? []) { const h = toHex(g); if (h) out.push({ hex: h, where: `gradient in ${what}` }); }
    }
    return out;
  });
}
