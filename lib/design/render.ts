import { chromium, type Browser } from "playwright";
import { EMAIL_WIDTH } from "./html";

// Renders the email page in headless Chromium at 2x and measures every section,
// so slicing and the fold check use exact positions instead of guesses.
// Local/dev uses Playwright's Chromium; on Vercel this swaps to @sparticuz/chromium.

export const SCALE = 2;

export type Box = { y: number; height: number };
export type MeasuredSection = Box & { id: string; type: string; ctas: Box[]; missingAssets: string[] };
export type Rendered = { png: Buffer; height: number; sections: MeasuredSection[] };

let browser: Browser | null = null;

const MEASURE = `(() => {
  const box = (e) => { const b = e.getBoundingClientRect(); return { y: b.top + scrollY, height: b.height }; };
  return [...document.querySelectorAll("[data-section]")].map((el) => ({
    id: el.getAttribute("data-section"),
    type: el.getAttribute("data-type"),
    ...box(el),
    ctas: [...el.querySelectorAll("[data-cta]")].map(box),
    missingAssets: [...el.querySelectorAll("[data-missing-asset]")].map((e) => e.getAttribute("data-missing-asset")),
  }));
})()`;

export async function renderEmail(html: string): Promise<Rendered> {
  browser ??= await chromium.launch();
  const page = await browser.newPage({ viewport: { width: EMAIL_WIDTH, height: 900 }, deviceScaleFactor: SCALE });
  try {
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    // Passed as a string: bundlers (tsx/esbuild) inject helpers into functions that don't exist in the page.
    const sections: MeasuredSection[] = await page.evaluate(MEASURE);
    const email = await page.$("main.email");
    const png = await email!.screenshot({ type: "png" });
    const height = sections.reduce((h, s) => Math.max(h, s.y + s.height), 0);
    return { png, height, sections };
  } finally {
    await page.close();
  }
}

export async function closeRenderer() {
  await browser?.close();
  browser = null;
}
