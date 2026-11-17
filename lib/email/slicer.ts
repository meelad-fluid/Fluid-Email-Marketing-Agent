// Turns a finished design (.dc.html from Claude Design, or plain HTML) into an image-sliced email:
//   render at 600px (2x) → cut so every link/button sits in its own linked slice → JPEG slices
//   → Klaviyo-ready HTML (live footer with unsubscribe/manage-preferences tags) → QC sheet + link checks.
import { chromium } from "playwright";
import sharp from "sharp";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type Slice = { i: number; y0: number; y1: number; href?: string; alt: string; file: string; bytes: number };
export type QcLink = { href: string; slices: number[]; status: number | string; finalUrl?: string; ok: boolean; note?: string };
export type SliceResult = { slices: Slice[]; footer: { bg: string; legal: string; logo?: string }; height: number; html: (urls: string[], logoUrl?: string) => string; text: string; links: QcLink[]; warnings: string[]; qcPng: string; qcMd: string };

const MAX_SLICE = 900; // CSS px; a taller region is split into slices that share its link

/** .dc.html → plain HTML with local file paths for /_blob/ assets (assets.json maps blob id → path under clientDir). */
export function dcToHtml(dcFile: string, clientDir: string): string {
  const src = readFileSync(dcFile, "utf8");
  const mapFile = join(dirname(dcFile), "assets.json");
  const map: Record<string, string> = existsSync(mapFile) ? JSON.parse(readFileSync(mapFile, "utf8")) : {};
  const inner = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)?.[1] ?? src;
  const css = inner.match(/<helmet>[\s\S]*?<style>([\s\S]*?)<\/style>[\s\S]*?<\/helmet>/)?.[1] ?? "";
  const body = inner.replace(/<helmet>[\s\S]*?<\/helmet>/, "");
  let html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0">${body}</body></html>`;
  html = html.replace(/\/_blob\/([0-9a-f]{32})/g, (m, id) => (map[id] ? pathToFileURL(resolve(clientDir, map[id])).href : m));
  const missing = [...html.matchAll(/\/_blob\/([0-9a-f]{32})/g)].map((m) => m[1]);
  if (missing.length) throw new Error(`assets.json is missing ${missing.length} image(s): ${[...new Set(missing)].join(", ")}`);
  return html;
}

export async function sliceEmail(htmlFile: string, outDir: string, meta: { subject: string; preview: string }): Promise<SliceResult> {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const warnings: string[] = [];
  try {
    const page = await browser.newPage({ viewport: { width: 600, height: 1000 }, deviceScaleFactor: 2 });
    await page.addInitScript("window.__name = (f) => f;"); // tsx/esbuild helper used inside page.evaluate callbacks
    await page.goto(pathToFileURL(htmlFile).href, { waitUntil: "load" });
    await page.evaluate(async () => { await (document as any).fonts.ready; });
    const info = await page.evaluate(() => {
      const root = document.body.firstElementChild as HTMLElement;
      const r0 = root.getBoundingClientRect();
      const rel = (r: DOMRect) => ({ top: r.top - r0.top, bottom: r.bottom - r0.top, left: r.left - r0.left, right: r.right - r0.left });
      const links = [...root.querySelectorAll("a[href]")].map((a) => ({ href: (a as HTMLAnchorElement).getAttribute("href")!, text: (a as HTMLElement).innerText.trim(), ...rel(a.getBoundingClientRect()) }));
      // Footer = the full-width block holding the unsubscribe link (or anything marked data-email-footer).
      let footer: HTMLElement | null = root.querySelector("[data-email-footer]");
      if (!footer) {
        const un = [...root.querySelectorAll("a")].find((a) => /unsubscribe/i.test(a.textContent ?? ""));
        let el: HTMLElement | null = un ?? null;
        while (el && el !== root && el.getBoundingClientRect().width < r0.width - 10) el = el.parentElement;
        footer = el && el !== root ? el : null;
      }
      const fRect = footer ? rel(footer.getBoundingClientRect()) : null;
      const logo = footer?.querySelector("img")?.getAttribute("src") ?? undefined;
      const legal = footer ? [...footer.querySelectorAll("p")].map((p) => p.innerText.trim()).filter((t) => t && !/unsubscribe|manage preferences/i.test(t)).join(" ") : "";
      const bg = footer ? getComputedStyle(footer).backgroundColor : "#000";
      // Visible text with positions, for alt text.
      const texts: { y: number; t: string }[] = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = (n.textContent ?? "").replace(/\s+/g, " ").trim();
        if (!t) continue;
        const range = document.createRange(); range.selectNodeContents(n);
        const r = range.getBoundingClientRect();
        if (r.height) texts.push({ y: r.top - r0.top + r.height / 2, t });
      }
      // Content regions: split the email into sections, and a section into its parts only when it holds
      // more than one destination (e.g. three product cards, each with its own button). A region with one
      // link takes that link everywhere; a region with no link gets the email's fallback link later.
      const hrefsIn = (el: Element) => new Set([...el.querySelectorAll("a[href]")].filter((a) => !footer?.contains(a)).map((a) => a.getAttribute("href")!));
      const flowKids = (el: Element) => [...el.children].filter((c) => { const cs = getComputedStyle(c); const r = c.getBoundingClientRect(); return cs.position !== "absolute" && cs.position !== "fixed" && r.height > 0 && c.tagName !== "STYLE" && c.tagName !== "SCRIPT"; });
      const span = (el: Element) => { let t = Infinity, b = -Infinity; for (const x of [el, ...el.querySelectorAll("*")]) { const r = x.getBoundingClientRect(); if (!r.height) continue; t = Math.min(t, r.top); b = Math.max(b, r.bottom); } return { top: t - r0.top, bottom: b - r0.top }; };
      type Region = { top: number; bottom: number; href: string | null; label: string; conflict?: string[] };
      const out: Region[] = [];
      const walk = (el: Element, depth: number) => {
        const hs = hrefsIn(el);
        const kids = flowKids(el);
        if (hs.size <= 1 || !kids.length || depth > 8) {
          const sp = span(el);
          out.push({ ...sp, href: [...hs][0] ?? null, label: (el as HTMLElement).innerText.trim().split("\n")[0].slice(0, 60), conflict: hs.size > 1 ? [...hs] : undefined });
          return;
        }
        for (const k of kids) walk(k, depth + 1);
      };
      for (const k of flowKids(root)) if (k !== footer && !k.contains(footer as Node)) walk(k, 0); else if (footer && k.contains(footer) && k !== footer) for (const kk of flowKids(k)) if (kk !== footer && !kk.contains(footer)) walk(kk, 1);
      return { height: Math.round(r0.height), links, footerTop: fRect?.top ?? null, logo, legal, bg, texts, regions: out };
    });
    const shot = await page.locator("body > *:first-child").screenshot({ type: "png" });
    const H = Math.round(info.footerTop ?? info.height);

    // Fallback link for regions with no button: the email's main call to action (first link), else the homepage.
    const contentLinks = info.links.filter((l) => l.top < H && l.href && l.href !== "#");
    const fallback = contentLinks[0]?.href ?? (contentLinks[0] ? new URL(contentLinks[0].href).origin + "/" : undefined);
    if (!fallback) warnings.push("The email has no links at all; slices are unlinked.");

    // Regions in order; neighbours with the same destination merge into one slice; gaps are split between them.
    const regs = info.regions.map((r) => ({ top: Math.max(0, r.top), bottom: Math.min(H, r.bottom), href: r.href ?? fallback, own: !!r.href, label: r.label, conflict: r.conflict }))
      .filter((r) => r.bottom - r.top > 2).sort((a, b) => a.top - b.top);
    for (const r of regs) if (r.conflict) warnings.push(`"${r.label}" has several links side by side (${r.conflict.join(" , ")}); the slice uses the first. Give each its own block in the design to link them separately.`);
    const merged: typeof regs = [];
    for (const r of regs) {
      const last = merged[merged.length - 1];
      // Merge into the previous slice when it's the same destination and neither side has its own button,
      // or when the regions overlap (an element breaking out of its card).
      if (last && ((last.href === r.href && !(last.own && r.own)) || r.top < last.bottom - 4)) { last.bottom = Math.max(last.bottom, r.bottom); last.own = last.own || r.own; if (r.own) last.href = r.href; continue; }
      merged.push({ ...r });
    }
    const raw: { y0: number; y1: number; href?: string }[] = [];
    for (const [i, m] of merged.entries()) {
      const y0 = i === 0 ? 0 : raw[raw.length - 1].y1;
      const next = merged[i + 1];
      const y1 = next ? Math.round(m.bottom + Math.max(0, next.top - m.bottom) / 2) : H;
      // Very tall regions are split into several slices with the same link.
      const n = Math.max(1, Math.ceil((y1 - y0) / MAX_SLICE));
      for (let k = 0; k < n; k++) raw.push({ y0: Math.round(y0 + ((y1 - y0) * k) / n), y1: Math.round(y0 + ((y1 - y0) * (k + 1)) / n), href: m.href });
    }

    const slices: Slice[] = [];
    for (const [i, s] of raw.entries()) {
      const file = join(outDir, `slice-${String(i + 1).padStart(2, "0")}.jpg`);
      const buf = await sharp(shot).extract({ left: 0, top: s.y0 * 2, width: 1200, height: (s.y1 - s.y0) * 2 }).flatten({ background: "#ffffff" }).jpeg({ quality: 84, progressive: true, mozjpeg: true }).toBuffer();
      writeFileSync(file, buf);
      const alt = info.texts.filter((t) => t.y >= s.y0 && t.y < s.y1).map((t) => t.t).join(" ").replace(/\s+/g, " ").slice(0, 180);
      slices.push({ i: i + 1, ...s, alt, file, bytes: buf.length });
      if (buf.length > 1_000_000) warnings.push(`Slice ${i + 1} is ${(buf.length / 1e6).toFixed(1)} MB; aim for under 1 MB.`);
    }

    // Link checks (status after redirects).
    const byHref = new Map<string, number[]>();
    for (const s of slices) if (s.href) (byHref.get(s.href) ?? byHref.set(s.href, []).get(s.href)!).push(s.i);
    const links: QcLink[] = [];
    for (const [href, idx] of byHref) {
      if (!/^https?:/.test(href)) { links.push({ href, slices: idx, status: "not a web link", ok: false }); continue; }
      try {
        const r = await fetch(href, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (Fluid QC)" } });
        const checkout = /\/checkouts?\/|shop\.app\/checkout/.test(r.url); // Shopify checkout blocks bots (403) after a correct redirect
        links.push({ href, slices: idx, status: r.status, finalUrl: r.url, ok: r.ok || checkout, note: checkout ? "redirects into checkout" : undefined });
      } catch (e: any) { links.push({ href, slices: idx, status: e.message, ok: false }); }
    }
    for (const l of info.links.filter((l) => l.top < H && (!l.href || l.href === "#"))) warnings.push(`Button "${l.text}" has no real link.`);

    // QC sheet: each slice at 600px with its link written beside it.
    const W = 1100, rows = slices.map((s) => ({ s, h: s.y1 - s.y0 }));
    const total = rows.reduce((t, r) => t + r.h + 6, 0);
    const comps: { input: Buffer; left: number; top: number }[] = [];
    let top = 0;
    for (const { s, h } of rows) {
      comps.push({ input: await sharp(s.file).resize(600).toBuffer(), left: 0, top });
      const label = `${s.i}. ${s.href ? s.href.replace(/^https?:\/\//, "").slice(0, 58) : "no link"}`;
      const col = s.href ? (links.find((l) => l.href === s.href)?.ok ? "#1a7f37" : "#c62828") : "#888";
      comps.push({ input: Buffer.from(`<svg width="${W - 610}" height="${Math.max(h, 24)}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="6" height="${h}" fill="${col}"/><text x="16" y="18" font-family="Helvetica" font-size="14" fill="${col}">${label.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text></svg>`), left: 610, top });
      top += h + 6;
    }
    const qcPng = join(outDir, "qc-sheet.png");
    await sharp({ create: { width: W, height: total, channels: 3, background: "#ffffff" } }).composite(comps).png().toFile(qcPng);

    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const legal = info.legal;
    const html = (urls: string[], logoUrl?: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${esc(meta.subject)}</title>
<style>img{border:0;outline:none;text-decoration:none}a{text-decoration:none}@media (max-width:620px){.wrap{width:100%!important}}</style></head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(meta.preview)}${"&#847;&zwnj;&nbsp;".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px">
${slices.map((s, k) => {
  const img = `<img src="${urls[k]}" width="600" alt="${esc(s.alt)}" style="display:block;width:100%;max-width:600px;height:auto">`;
  return `<tr><td style="padding:0;font-size:0;line-height:0">${s.href ? `<a href="${esc(s.href)}" target="_blank">${img}</a>` : img}</td></tr>`;
}).join("\n")}
<tr><td align="center" style="background:${info.bg};padding:28px 40px 36px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#a3a3a3">
${logoUrl ? `<a href="${esc(slices.find((s) => s.href?.startsWith("http"))?.href ? new URL(slices.find((s) => s.href?.startsWith("http"))!.href!).origin + "/" : "#")}" target="_blank"><img src="${logoUrl}" width="92" alt="" style="display:block;margin:0 auto 16px;width:92px;height:auto"></a>` : ""}
<p style="margin:0 0 10px;font-size:13px">{% manage_preferences 'Manage preferences' %} | {% unsubscribe 'Unsubscribe' %}</p>
${legal ? `<p style="margin:0 0 10px">${esc(legal)}</p>` : ""}
<p style="margin:0">{{ organization.name }} · {{ organization.full_address }}</p>
</td></tr>
</table></td></tr></table></body></html>`;
    const text = [meta.subject, meta.preview, "", ...slices.map((s) => (s.href ? `${s.alt}\n${s.href}` : s.alt)).filter(Boolean), "", legal, "Unsubscribe: {% unsubscribe_url %}"].join("\n\n");

    const kb = (n: number) => `${Math.round(n / 1024)} KB`;
    const qcMd = [
      `# QC: ${meta.subject}`,
      `Preview text: ${meta.preview}`,
      `${slices.length} slices · ${kb(slices.reduce((t, s) => t + s.bytes, 0))} of images · email height ${H}px + live footer`,
      "",
      "## Links",
      ...links.map((l) => `- ${l.ok ? "✅" : "❌"} slices ${l.slices.join(", ")} → ${l.href} (${l.status}${l.note ? `, ${l.note}` : ""})`),
      "",
      "## Slices",
      ...slices.map((s) => `- ${s.i}. ${s.y1 - s.y0}px · ${kb(s.bytes)} · ${s.href ? "linked" : "no link"} · alt: "${s.alt.slice(0, 90)}"`),
      "",
      "## Checks",
      `- ${links.every((l) => l.ok) ? "✅" : "❌"} every link resolves`,
      `- ${slices.every((s) => s.href) ? "✅" : "❌"} every slice is clickable`,
      `- ${slices.every((s) => s.bytes < 1_000_000) ? "✅" : "❌"} every slice under 1 MB`,
      `- ✅ unsubscribe + manage preferences are live Klaviyo tags in the footer`,
      `- ✅ preview text set`,
      ...warnings.map((w) => `- ⚠️ ${w}`),
    ].join("\n");
    return { slices, footer: { bg: info.bg, legal, logo: info.logo }, height: H, html, text, links, warnings, qcPng, qcMd };
  } finally {
    await browser.close();
  }
}
