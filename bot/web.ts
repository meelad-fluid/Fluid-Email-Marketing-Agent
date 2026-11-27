// Review pages, served by the bot process (Railway gives it a public URL; set PUBLIC_URL to it).
//   GET  /r/:token              the review page (email at full quality, pinned comments, approve)
//   GET  /r/:token/frame?v=N    the email itself (version N, default latest)
//   GET  /r/:token/assets/...   images/fonts from that client's folder only
//   GET  /r/:token/data         review state as JSON
//   POST /r/:token/comments     {version, x?, y?, body, author, parent_id?}
//   POST /r/:token/resolve      {comment_id, resolved}
//   POST /r/:token/approve      {author, build?}  "Approve & build": approve, then the bot builds it in Klaviyo
//   POST /r/:token/submit       {author}          "Submit comments": the bot makes every open comment's change
//   GET  /p/:token              "Choose your pop-up style": 3 playable pop-up examples in the client's brand (/data, /file, POST /choose {style, author})
//   GET  /b/:token              a client's brand book + client library (/data as JSON, /file?p=brand/... for logos & fonts)
// A link's token only ever opens its own design. Nothing here can send email or touch Klaviyo.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { CLIENTS_DIR } from "./config";
import { db } from "./db";
import { saveClientFolder } from "./git";
import { flowOf, reviewLink, type Review } from "./review";
import { connectionStatus, formLink, formSections, hasExistingForm, MAX_UPLOAD, saveForm, saveInternalForm, saveKeysForm, saveShopifyForm, saveUpload } from "./onboarding";
import { marked } from "marked";
import { parseCalendarMarkdown } from "../lib/strategy/calendar";
import { currentBrandBook, listLibrary, signedUrl } from "../lib/library/store";
import { maxDiscount } from "../lib/shopify/discounts";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";

type Notify = (channel: string, thread: string | null, text: string) => Promise<void>;
/** Work the review page hands to the bot: build an approved email/flow, or apply submitted comments. */
export type ReviewAction = { kind: "build" | "build_flow" | "comments" | "style"; reviewId: string; clientId: string; title: string; designPath: string; author: string; channel: string | null; thread: string | null; flow?: string; designs?: string[]; count?: number };
const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf" };
const hits = new Map<string, number[]>();
const POPUP_PAGE = join(fileURLToPath(new URL(".", import.meta.url)), "pages", "popup-styles.html");
export const POPUP_STYLES = { plinko: "Plinko game", cards: "Pick 3 cards", standard: "Classic 4-step" } as const;

// ── Approval updates: people approve several emails in a row, so collect them for a minute and post one
// teammate-style line ("Nick approved the welcome flow") instead of one log line per email.
type Approval = { channel: string; thread: string | null; clientId: string; title: string; author: string };
const pendingApprovals = new Map<string, { items: Approval[]; timer: ReturnType<typeof setTimeout> }>();
export function queueApproval(notify: Notify, a: Approval) {
  const p = pendingApprovals.get(a.channel) ?? { items: [], timer: setTimeout(() => {}, 0) };
  clearTimeout(p.timer);
  p.items.push(a);
  p.timer = setTimeout(() => { pendingApprovals.delete(a.channel); approvalMessage(p.items).then((t) => notify(a.channel, null, t)).catch((e) => console.error("[approvals]", e.message)); }, 60_000);
  pendingApprovals.set(a.channel, p);
}
const andList = (xs: string[]) => xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
export async function approvalMessage(items: Approval[]): Promise<string> {
  const people = andList([...new Set(items.map((i) => i.author.split(" ")[0]))]);
  const { data: all } = await db().from("design_reviews").select("title, status").eq("client_id", items[0].clientId);
  const parts: string[] = [];
  const flows = new Map<string, Set<number>>();
  const waiting: string[] = [];
  for (const i of items) { const f = flowOf(i.title); if (f) flows.set(f.flow, (flows.get(f.flow) ?? new Set()).add(f.n)); else parts.push(`the ${i.title.split(/\s+[—–-]\s+/)[0]} email`); }
  for (const [flow, nums] of flows) {
    const inFlow = (all ?? []).filter((d) => flowOf(d.title)?.flow.toLowerCase() === flow.toLowerCase());
    const allApproved = inFlow.length > 1 && inFlow.every((d) => d.status === "approved");
    const name = flow.toLowerCase().includes("flow") ? flow.toLowerCase() : `${flow.toLowerCase()} flow`;
    const sorted = [...nums].sort((a, b) => a - b);
    const range = sorted.length > 2 && sorted[sorted.length - 1] - sorted[0] === sorted.length - 1 ? [`#${sorted[0]}–${sorted[sorted.length - 1]}`] : sorted.map((n) => `#${n}`);
    parts.push(allApproved ? `the whole ${name}` : `${flow.toLowerCase()} ${nums.size > 1 ? "emails" : "email"} ${andList(range)}`);
    const left = inFlow.filter((d) => d.status !== "approved").map((d) => d.title.split(/\s+[—–-]\s+/)[0].replace(/\s+email\s+/i, " "));
    if (!allApproved && left.length && left.length <= 2) waiting.push(`${andList(left)} ${left.length > 1 ? "are" : "is"} still waiting`);
  }
  const whole = parts.some((p) => p.startsWith("the whole"));
  return `${people} approved ${andList([...new Set(parts)])}${whole ? ", so it's ready to build." : "."}${waiting.length ? ` ${waiting.join(". ").replace(/^./, (c) => c.toUpperCase())}.` : ""}`;
}
const limited = (ip: string) => { const now = Date.now(); const h = (hits.get(ip) ?? []).filter((t) => now - t < 600_000); h.push(now); hits.set(ip, h); return h.length > 40; };

async function body(req: IncomingMessage): Promise<any> {
  let raw = "";
  for await (const c of req) { raw += c; if (raw.length > 20_000) throw new Error("too large"); }
  return raw ? JSON.parse(raw) : {};
}
const send = (res: ServerResponse, code: number, data: string | Buffer, type = "text/plain; charset=utf-8", extra: Record<string, string> = {}) => {
  res.writeHead(code, { "content-type": type, "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff", ...extra });
  res.end(data);
};
const json = (res: ServerResponse, code: number, o: unknown) => send(res, code, JSON.stringify(o), "application/json");

async function load(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const { data } = await db().from("design_reviews").select("*, clients(name, folder)").eq("token", token).maybeSingle();
  return data as (Review & { clients: { name: string; folder: string } }) | null;
}

export function startWeb(notify: Notify, onFormSubmitted: (r: { clientId: string; folder: string; name: string; klaviyo: string; internal?: boolean }) => void = () => {}, onReviewAction: (a: ReviewAction) => void = () => {}) {
  const port = Number(process.env.PORT || 8080);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://x");
      const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "").split(",")[0].trim();
      if (url.pathname === "/health") return send(res, 200, "ok");

      // ── Client onboarding form ──
      const ob = url.pathname.match(/^\/onboard\/([A-Za-z0-9_-]+)(\/submit|\/upload)?$/);
      if (ob) {
        const l = await formLink(ob[1]);
        if (!l) return send(res, 404, "This onboarding link has expired or was already used. Ask your Fluid contact for a new one.");
        const internal = l.kind === "internal";
        if (l.kind === "keys") {
          if (req.method === "GET" && !ob[2]) return send(res, 200, keysPage(l.clients.name, await connectionStatus(l.client_id)), "text/html; charset=utf-8", { "cache-control": "no-store" });
          if (req.method === "POST" && ob[2] === "/submit") {
            if (limited(ip)) return json(res, 429, { error: "Too many tries, wait a few minutes." });
            try {
              const r = await saveKeysForm(ob[1], await body(req));
              const { data: ch } = await db().from("slack_channels").select("channel_id").eq("client_id", r.clientId).limit(1).maybeSingle();
              if (ch) await notify(ch.channel_id, null, `API keys updated for ${r.name}: ${r.done.join(" · ")}.`).catch(() => {});
              return json(res, 200, { ok: true, done: r.done });
            } catch (e: any) { return json(res, 400, { error: e.message }); }
          }
          return send(res, 404, "Not found");
        }
        if (l.kind === "shopify") {
          if (req.method === "GET" && !ob[2]) return send(res, 200, shopifyPage(l.clients.name), "text/html; charset=utf-8", { "cache-control": "no-store" });
          if (req.method === "POST" && ob[2] === "/submit") {
            if (limited(ip)) return json(res, 429, { error: "Too many tries, wait a few minutes." });
            let raw = ""; for await (const c of req) { raw += c; if (raw.length > 20_000) return json(res, 413, { error: "Too long" }); }
            try {
              const r = await saveShopifyForm(ob[1], JSON.parse(raw || "{}").shopify ?? {});
              const { data: ch } = await db().from("slack_channels").select("channel_id").eq("client_id", r.clientId).limit(1).maybeSingle();
              if (ch) await notify(ch.channel_id, null, `Shopify is connected for ${r.name} (${r.shopify.name}).${r.shopify.missing_read.length ? ` It's missing ${r.shopify.missing_read.join(", ")}, so some reports won't work until the app gets those scopes.` : ""} ${r.shopify.can_create_discounts ? "It can create discount codes once an admin turns that on (/fluid shopify-discounts on)." : "It's read-only (the app doesn't have write_discounts), so I can't create discount codes yet."}`);
              return json(res, 200, { ok: true, name: r.shopify.name });
            } catch (e: any) { return json(res, 400, { error: e.message }); }
          }
          return send(res, 404, "Not found");
        }
        if (req.method === "GET" && !ob[2]) return send(res, 200, internal ? internalPage(l.clients.name) : formPage(l.clients.name, hasExistingForm(l.clients.folder)), "text/html; charset=utf-8", { "cache-control": "no-store" });
        if (req.method === "POST" && ob[2] === "/upload" && internal) {
          if (limited(ip)) return json(res, 429, { error: "Too many uploads, wait a few minutes." });
          const chunks: Buffer[] = []; let n = 0;
          for await (const c of req) { n += c.length; if (n > MAX_UPLOAD) return json(res, 413, { error: "That file is too big (30 MB max)." }); chunks.push(c as Buffer); }
          try { return json(res, 200, { ok: true, name: await saveUpload(ob[1], String(url.searchParams.get("name") ?? "file"), Buffer.concat(chunks)) }); }
          catch (e: any) { return json(res, 400, { error: e.message }); }
        }
        if (req.method === "POST" && ob[2] === "/submit") {
          if (limited(ip)) return json(res, 429, { error: "Too many tries, wait a few minutes." });
          let raw = ""; for await (const c of req) { raw += c; if (raw.length > 200_000) return json(res, 413, { error: "Too long" }); }
          const b = JSON.parse(raw || "{}");
          try { const r = internal ? await saveInternalForm(ob[1], b.answers ?? {}, b.klaviyo_key, b.shopify?.shop || b.shopify?.secret ? b.shopify : undefined) : await saveForm(ob[1], b.answers ?? {}, b.klaviyo_key); onFormSubmitted(r); return json(res, 200, { ok: true }); }
          catch (e: any) { return json(res, 400, { error: e.message }); }
        }
      }

      // ── Shared documents (onboarding doc, plans) ──
      const dm = url.pathname.match(/^\/d\/([A-Za-z0-9_-]{16,64})$/);
      if (dm && req.method === "GET") {
        const { data: d } = await db().from("doc_links").select("path, title, clients(name, folder)").eq("token", dm[1]).maybeSingle();
        if (!d) return send(res, 404, "Not found");
        const c: any = (d as any).clients;
        const base = join(CLIENTS_DIR, c.folder), file = resolve(base, d.path);
        if (!file.startsWith(base + sep) || !existsSync(file)) return send(res, 404, "This document isn't available.");
        return send(res, 200, docPage(d.title, c.name, marked.parse(readFileSync(file, "utf8")) as string), "text/html; charset=utf-8", { "cache-control": "no-store" });
      }

      // ── Campaign calendar: month grid of a strategy doc's sends, colour-coded, click a send for its brief ──
      const cm = url.pathname.match(/^\/c\/([A-Za-z0-9_-]{16,64})(\/data)?$/);
      if (cm && req.method === "GET") {
        const { data: d } = await db().from("doc_links").select("path, title, clients(name, folder)").eq("token", cm[1]).maybeSingle();
        if (!d) return send(res, 404, "Not found");
        if (!cm[2]) return send(res, 200, calendarPage(), "text/html; charset=utf-8", { "cache-control": "no-store" });
        const c: any = (d as any).clients;
        const base = join(CLIENTS_DIR, c.folder), file = resolve(base, d.path);
        if (!file.startsWith(base + sep) || !existsSync(file)) return json(res, 404, { error: "This calendar isn't available." });
        const cal = parseCalendarMarkdown(readFileSync(file, "utf8"));
        return json(res, 200, { client: c.name, title: cal.title, status: cal.status ?? null, sends: cal.sends, sections: cal.sections.map((x) => ({ heading: x.heading, html: marked.parse(x.markdown) as string })) });
      }

      // ── Choose your pop-up style (onboarding): examples only, nothing here talks to the pop-up platform ──
      const pm = url.pathname.match(/^\/p\/([A-Za-z0-9_-]{16,64})(\/data|\/file|\/choose)?$/);
      if (pm) {
        const { data: d } = await db().from("doc_links").select("client_id, path, clients(name, folder)").eq("token", pm[1]).maybeSingle();
        if (!d || d.path !== "popups/style") return send(res, 404, "Not found");
        const c: any = (d as any).clients, base = join(CLIENTS_DIR, c.folder), dirFile = join(base, "brand", "direction.md");
        if (req.method === "GET" && !pm[2]) return send(res, 200, readFileSync(POPUP_PAGE, "utf8"), "text/html; charset=utf-8", { "cache-control": "no-store" });
        if (req.method === "GET" && pm[2] === "/file") {
          const file = resolve(base, url.searchParams.get("p") ?? ""), type = TYPES[extname(file).toLowerCase()];
          if (!file.startsWith(join(base, "brand") + sep) || !type || !existsSync(file)) return send(res, 404, "Not found");
          return send(res, 200, readFileSync(file), type, { "cache-control": "private, max-age=300" });
        }
        const chosen = () => { const t = existsSync(dirFile) ? readFileSync(dirFile, "utf8").match(/^\W*Pop-up style:\s*([^(\n]+)/im)?.[1]?.trim().toLowerCase() : ""; return t ? (Object.entries(POPUP_STYLES).find(([, n]) => t.startsWith(n.toLowerCase()))?.[0] ?? null) : null; };
        if (req.method === "GET" && pm[2] === "/data") {
          const book = await currentBrandBook(db(), d.client_id).catch(() => null), k: any = book?.kit;
          const hex = (h?: string) => (h && /^#[0-9a-f]{6}$/i.test(h) ? h : undefined);
          const lum = (h: string) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
          const colors: string[] = (k?.colors ?? []).map((x: any) => hex(x.hex)).filter(Boolean);
          const brand = hex(k?.buttons?.fill) ?? colors.filter((h) => lum(h) > 40 && lum(h) < 200)[0] ?? colors[0];
          const soft = colors.filter((h) => lum(h) > 215 && lum(h) < 252)[0];
          const font = (role: RegExp) => (k?.fonts ?? []).find((f: any) => role.test(f.role));
          const head = font(/head|display|title/i) ?? k?.fonts?.[0], bodyF = font(/body|text|paragraph/i) ?? head;
          const google = [head, bodyF].filter((f: any) => f && f.source === "google").map((f: any) => f.family);
          const fontsHref = google.length ? `https://fonts.googleapis.com/css2?${[...new Set(google)].map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;700`).join("&")}&display=swap` : undefined;
          const logo = (k?.logos ?? []).find((l: any) => l.path && existsSync(join(base, l.path)) && TYPES[extname(l.path).toLowerCase()]);
          const max = maxDiscount(base);
          const read = (f: string) => (existsSync(join(base, f)) ? readFileSync(join(base, f), "utf8") : "");
          const offer = Number(read("copy/style-options-welcome.md").match(/\*\*Offer:\*\*[^\n]*?(\d{1,2})\s*%/i)?.[1] ?? read("memory.md").match(/welcome[^\n%]{0,40}?(\d{1,2})\s*%/i)?.[1] ?? Math.min(10, max));
          const shape = k?.buttons?.shape;
          // No brand book in the database yet: fall back to brand/brand-kit.md (colors, logo, radius, casing, fonts).
          const md = read("brand/brand-kit.md");
          const mdColors = [...md.matchAll(/^[^\n#]*?(#[0-9a-f]{6})\b.*$/gim)].map((m) => ({ hex: m[1], line: m[0] }));
          const mdBrand = (mdColors.find((x) => /button|brand|primary/i.test(x.line)) ?? mdColors[0])?.hex;
          const mdSoft = mdColors.map((x) => x.hex).find((h) => lum(h) > 215 && lum(h) < 252);
          const mdLogo = md.match(/(brand\/assets\/[^\s)`,;]*logo[^\s)`,;]*\.(?:png|svg|jpe?g|webp))/i)?.[1];
          const mdFont = (role: string) => md.match(new RegExp(`([A-Z][A-Za-z0-9 ]{1,40}?)\\s+(?:for|on)\\s+(?:the\\s+)?${role}`, "i"))?.[1]?.trim();
          const display = head?.family ?? mdFont("headings?|headlines?|display"), bodyFam = bodyF?.family ?? mdFont("body|text");
          // Custom fonts: serve the client's own font files.
          const fontsDir = join(base, "brand", "fonts"), files = existsSync(fontsDir) ? readdirSync(fontsDir).filter((f) => /\.(woff2?|ttf|otf)$/i.test(f)) : [];
          const squash = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
          const fontFaces = [display, bodyFam].filter(Boolean).map((fam) => { const f = files.find((x) => squash(x).includes(squash(fam!))) ; return f ? { family: fam, url: `/p/${pm[1]}/file?p=${encodeURIComponent(`brand/fonts/${f}`)}` } : null; }).filter(Boolean);
          const logoPath = logo?.path ?? (mdLogo && existsSync(join(base, mdLogo)) ? mdLogo : undefined);
          const finalBrand = brand ?? mdBrand;
          return json(res, 200, { client: c.name, brand: finalBrand, brandInk: hex(k?.buttons?.text) ?? (finalBrand && lum(finalBrand) > 170 ? "#1d1d1d" : "#ffffff"), soft: soft ?? mdSoft,
            radius: shape === "pill" ? 999 : shape === "square" ? 0 : k?.buttons?.radius_px ?? Number(md.match(/(\d{1,3})\s*px radius/i)?.[1] ?? 10),
            fontsHref, fontFaces, display, body: bodyFam, logo: logoPath ? `/p/${pm[1]}/file?p=${encodeURIComponent(logoPath)}` : null,
            offer: Math.min(offer, max), max, casing: k?.buttons?.casing ?? (/CTA casing:?\**:?\s*ALL CAPS/i.test(md) ? "ALL CAPS" : "Title Case"), choice: chosen() });
        }
        if (req.method === "POST" && pm[2] === "/choose") {
          if (limited(ip)) return json(res, 429, { error: "Too many tries, wait a few minutes." });
          const b = await body(req);
          const style = String(b.style ?? ""), author = String(b.author ?? "").trim().slice(0, 60) || "The client";
          if (!(style in POPUP_STYLES)) return json(res, 400, { error: "Pick one of the three styles." });
          const name = POPUP_STYLES[style as keyof typeof POPUP_STYLES], day = new Date().toISOString().slice(0, 10);
          const line = `Pop-up style: ${name} (chosen by ${author}, ${day}, on the pop-up style page)`;
          const cur = existsSync(dirFile) ? readFileSync(dirFile, "utf8") : "";
          const next = /^\W*Pop-up style:.*$/im.test(cur) ? cur.replace(/^\W*Pop-up style:.*$/im, line)
            : /^\W*Design style:.*$/im.test(cur) ? cur.replace(/^(\W*Design style:.*)$/im, `$1\n${line}`) : `${line}\n\n${cur}`;
          mkdirSync(join(base, "brand"), { recursive: true });
          writeFileSync(dirFile, next.trimEnd() + "\n");
          const mem = join(base, "memory.md");
          if (existsSync(mem)) writeFileSync(mem, readFileSync(mem, "utf8").trimEnd() + `\n- ${day} · Pop-up style chosen: ${name} (by ${author}, on the pop-up style page). Build the pop-up in Alia in this style.\n`);
          saveClientFolder(c.folder, `${c.folder}: pop-up style ${name} chosen by ${author}`).catch(() => {});
          const { data: ch } = await db().from("slack_channels").select("channel_id").eq("client_id", d.client_id).limit(1).maybeSingle();
          if (ch) await notify(ch.channel_id, null, `${author} chose the *${name}* pop-up for ${c.name}. It's saved as their pop-up style.`).catch(() => {});
          return json(res, 200, { ok: true });
        }
        return send(res, 404, "Not found");
      }

      // ── Brand book + client library ──
      const bm = url.pathname.match(/^\/b\/([A-Za-z0-9_-]{16,64})(\/data|\/file)?$/);
      if (bm && req.method === "GET") {
        const { data: d } = await db().from("doc_links").select("client_id, path, clients(name, folder)").eq("token", bm[1]).maybeSingle();
        if (!d || d.path !== "brand/brand-book") return send(res, 404, "Not found");
        const c: any = (d as any).clients;
        if (!bm[2]) return send(res, 200, brandBookPage(), "text/html; charset=utf-8", { "cache-control": "no-store" });
        const base = join(CLIENTS_DIR, c.folder), brandDir = join(base, "brand");
        if (bm[2] === "/file") {
          // Logos and font files from this client's brand/ folder only.
          const file = resolve(base, url.searchParams.get("p") ?? "");
          const type = TYPES[extname(file).toLowerCase()];
          if (!file.startsWith(brandDir + sep) || !type || !existsSync(file)) return send(res, 404, "Not found");
          return send(res, 200, readFileSync(file), type, { "cache-control": "private, max-age=300" });
        }
        const [book, items] = await Promise.all([currentBrandBook(db(), d.client_id), listLibrary(db(), d.client_id, { limit: 200 })]);
        const library = await Promise.all(items.map(async (i) => ({ id: i.id, kind: i.kind, title: i.title, notes: i.notes, copy: i.copy_text, email_type: i.email_type, tags: i.tags, saved: i.created_at.slice(0, 10), saved_by: i.saved_by, link: i.source_url, mime: i.mime, width: i.width, height: i.height, url: i.storage_path ? await signedUrl(db(), i.storage_path, 3 * 3600) : null })));
        const fontsDir = join(brandDir, "fonts");
        const fontFiles = existsSync(fontsDir) ? readdirSync(fontsDir).filter((f) => /\.(woff2?|ttf|otf)$/i.test(f)).map((f) => `brand/fonts/${f}`) : [];
        return json(res, 200, { client: c.name, book: book ? { version: book.version, status: book.status, updated: book.created_at.slice(0, 10), note: book.note, ...book.kit } : null, library, fontFiles });
      }

      // ── Flow review: every email of one flow behind a "Go to email #" bar ──
      const fm = url.pathname.match(/^\/f\/([A-Za-z0-9_-]{16,64})(\/data)?$/);
      if (fm && req.method === "GET") {
        const { data: fr } = await db().from("flow_reviews").select("client_id, flow, clients(name)").eq("token", fm[1]).maybeSingle();
        if (!fr) return send(res, 404, "This flow link doesn't exist or has been removed.");
        if (!fm[2]) return send(res, 200, flowPage(), "text/html; charset=utf-8", { "cache-control": "no-store" });
        const { data: all } = await db().from("design_reviews").select("token, title, status, current_version, approved_version").eq("client_id", fr.client_id);
        const emails = (all ?? []).map((d) => ({ d, f: flowOf(d.title) })).filter((x) => x.f && x.f.flow.toLowerCase() === fr.flow.toLowerCase())
          .sort((a, b) => a.f!.n - b.f!.n || a.f!.variant.localeCompare(b.f!.variant))
          .map(({ d, f }) => ({ label: `#${f!.n}${f!.variant ? ` ${f!.variant}` : ""}`, title: d.title.split(/\s+[—–-]\s+/).slice(1).join(" — ") || d.title, token: d.token, approved: d.status === "approved" && d.approved_version === d.current_version }));
        return json(res, 200, { flow: fr.flow, client: (fr as any).clients?.name ?? "", emails });
      }

      const m = url.pathname.match(/^\/r\/([A-Za-z0-9_-]+)(\/.*)?$/);
      if (!m) return send(res, 404, "Not found");
      const r = await load(m[1]);
      if (!r) return send(res, 404, "This review link doesn't exist or has been removed.");
      const sub = m[2] ?? "";

      if (req.method === "GET" && sub === "") return send(res, 200, PAGE, "text/html; charset=utf-8", { "cache-control": "no-store" });
      // Full-length JPEG of a version (2x, for sharing or decks). Rendered once per version, then cached.
      if (req.method === "GET" && sub === "/jpeg") {
        const v = Number(url.searchParams.get("v")) || r.current_version;
        const { data } = await db().from("design_review_versions").select("version").eq("review_id", r.id).eq("version", v).maybeSingle();
        if (!data) return send(res, 404, "Version not found");
        const file = join(tmpdir(), `fluid-jpeg-${r.id}-v${v}.jpg`);
        if (!existsSync(file)) {
          if (limited(ip)) return send(res, 429, "Too many downloads, try again in a few minutes.");
          const { chromium } = await import("playwright");
          const browser = await chromium.launch();
          try {
            const page = await browser.newPage({ viewport: { width: 600, height: 1000 }, deviceScaleFactor: 2 });
            await page.goto(`http://127.0.0.1:${port}/r/${m[1]}/frame?v=${v}`, { waitUntil: "networkidle" });
            await page.evaluate(async () => { await (document as any).fonts.ready; });
            const el = page.locator("body > *:first-child");
            await el.screenshot({ path: file, type: "jpeg", quality: 90 });
          } finally { await browser.close(); }
        }
        const name = `${r.title.replace(/[^\w\s#&-]+/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "email"}.jpg`;
        return send(res, 200, readFileSync(file), "image/jpeg", { "content-disposition": `attachment; filename="${name}"`, "cache-control": "private, max-age=300" });
      }
      if (req.method === "GET" && sub === "/frame") {
        const v = Number(url.searchParams.get("v")) || r.current_version;
        const { data } = await db().from("design_review_versions").select("html").eq("review_id", r.id).eq("version", v).maybeSingle();
        if (!data) return send(res, 404, "Version not found");
        return send(res, 200, data.html.replace("<head>", '<head><base target="_blank">'), "text/html; charset=utf-8", { "cache-control": "no-store" });
      }
      if (req.method === "GET" && sub.startsWith("/assets/")) {
        const base = join(CLIENTS_DIR, r.clients.folder);
        const file = resolve(base, decodeURIComponent(sub.slice("/assets/".length)));
        const type = TYPES[extname(file).toLowerCase()];
        if (!file.startsWith(base + sep) || !type || !existsSync(file) || !statSync(file).isFile()) return send(res, 404, "Not found");
        return send(res, 200, readFileSync(file), type, { "cache-control": "public, max-age=86400" });
      }
      if (req.method === "GET" && sub === "/data") {
        const [{ data: versions }, { data: comments }] = await Promise.all([
          db().from("design_review_versions").select("version, note, created_at").eq("review_id", r.id).order("version"),
          db().from("review_comments").select("id, version, parent_id, x, y, body, author_name, author_kind, resolved, submitted_at, created_at").eq("review_id", r.id).order("created_at"),
        ]);
        const x = r as any;
        return json(res, 200, { title: r.title, client: r.clients.name, current: r.current_version, status: r.status, approved_version: r.approved_version, approved_by: r.approved_by, build_state: x.build_state ?? null, build_version: x.build_version ?? null, working: !!x.working_since && Date.now() - Date.parse(x.working_since) < 45 * 60_000, versions, comments });
      }
      if (req.method === "POST") {
        if (limited(ip)) return json(res, 429, { error: "Too many requests, try again in a few minutes." });
        const b = await body(req);
        const author = String(b.author ?? "").trim().slice(0, 80);
        if (!author) return json(res, 400, { error: "Add your name first." });
        if (sub === "/comments") {
          const text = String(b.body ?? "").trim().slice(0, 4000);
          if (!text) return json(res, 400, { error: "Write a comment first." });
          const parent = b.parent_id ? String(b.parent_id) : null;
          if (parent) {
            const { data: p } = await db().from("review_comments").select("id").eq("id", parent).eq("review_id", r.id).maybeSingle();
            if (!p) return json(res, 400, { error: "That comment is gone." });
          }
          const ins = await db().from("review_comments").insert({ review_id: r.id, version: Number(b.version) || r.current_version, parent_id: parent, x: parent ? null : Number(b.x), y: parent ? null : Number(b.y), body: text, author_name: author, author_kind: "reviewer" }).select("id").single();
          if (ins.error) return json(res, 500, { error: "Couldn't save the comment." });
          return json(res, 200, { ok: true, id: ins.data.id });
        }
        if (sub === "/resolve") {
          await db().from("review_comments").update({ resolved: !!b.resolved }).eq("id", String(b.comment_id)).eq("review_id", r.id);
          return json(res, 200, { ok: true });
        }
        if (sub === "/approve") {
          const now = new Date();
          await db().from("design_reviews").update({ status: "approved", approved_version: r.current_version, approved_by: author, approved_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", r.id);
          // Record it in the design's README (the bot reads the Status line) and save to GitHub.
          const readme = join(CLIENTS_DIR, r.clients.folder, r.design_path, "README.md");
          if (existsSync(readme)) {
            const s = readFileSync(readme, "utf8");
            const live = s.match(/^Status: .*?(goes live .*)$/m)?.[1];
            const line = `Status: approved by ${author} on ${now.toISOString().slice(0, 10)} (v${r.current_version})${live ? ` · ${live}` : ""}`;
            writeFileSync(readme, /^Status: .*$/m.test(s) ? s.replace(/^Status: .*$/m, line) : s.replace(/^(# .+\n)/, `$1${line}\n`));
            saveClientFolder(r.clients.folder, `${r.clients.folder}: ${r.title} approved by ${author} (v${r.current_version}, via review link)`).catch(() => {});
          }
          const clientId = (r as any).client_id as string;
          // Onboarding style options: "Choose this style" locks the account's design style; only one option stays chosen.
          if (flowOf(r.title)?.flow.toLowerCase() === "style options") {
            const { data: all } = await db().from("design_reviews").select("id, title").eq("client_id", clientId);
            const others = (all ?? []).filter((d) => d.id !== r.id && flowOf(d.title)?.flow.toLowerCase() === "style options").map((d) => d.id);
            if (others.length) await db().from("design_reviews").update({ status: "in_review", approved_version: null, approved_by: null }).in("id", others);
            onReviewAction({ kind: "style", reviewId: r.id, clientId, title: r.title, designPath: r.design_path, author, channel: r.slack_channel, thread: r.slack_thread });
            return json(res, 200, { ok: true, style: true });
          }
          if (!b.build) { if (r.slack_channel) queueApproval(notify, { channel: r.slack_channel, thread: r.slack_thread, clientId, title: r.title, author }); return json(res, 200, { ok: true }); }
          // "Approve & build": a campaign builds now; a flow email builds the whole flow once every email in it is approved.
          const base = { reviewId: r.id, clientId, title: r.title, designPath: r.design_path, author, channel: r.slack_channel, thread: r.slack_thread };
          const f = flowOf(r.title);
          if (!f) {
            await db().from("design_reviews").update({ build_state: "queued", build_version: r.current_version }).eq("id", r.id);
            onReviewAction({ kind: "build", ...base });
            return json(res, 200, { ok: true, building: "email" });
          }
          const { data: all } = await db().from("design_reviews").select("id, title, design_path, status, current_version, approved_version, build_state").eq("client_id", clientId);
          const inFlow = (all ?? []).filter((d) => flowOf(d.title)?.flow === f.flow);
          const left = inFlow.filter((d) => !(d.status === "approved" && d.approved_version === d.current_version));
          if (left.length) {
            if (r.slack_channel) queueApproval(notify, { channel: r.slack_channel, thread: r.slack_thread, clientId, title: r.title, author });
            return json(res, 200, { ok: true, building: null, waiting: left.length });
          }
          if (inFlow.some((d) => d.build_state === "queued")) return json(res, 200, { ok: true, building: "flow" });
          await db().from("design_reviews").update({ build_state: "queued" }).in("id", inFlow.map((d) => d.id));
          onReviewAction({ kind: "build_flow", ...base, flow: f.flow, designs: inFlow.map((d) => d.design_path) });
          return json(res, 200, { ok: true, building: "flow" });
        }
        if (sub === "/submit") {
          // "Submit comments": every open comment on the latest version goes to the bot in one batch.
          if ((r as any).working_since && Date.now() - Date.parse((r as any).working_since) < 45 * 60_000) return json(res, 409, { error: "Fluid is already working on the last comments. The new version will show up here." });
          const { data: open } = await db().from("review_comments").select("id").eq("review_id", r.id).eq("version", r.current_version).is("parent_id", null).eq("resolved", false).is("submitted_at", null);
          if (!open?.length) return json(res, 400, { error: "There are no new comments to submit." });
          const now = new Date().toISOString();
          await db().from("review_comments").update({ submitted_at: now }).in("id", open.map((c) => c.id));
          await db().from("design_reviews").update({ working_since: now }).eq("id", r.id);
          onReviewAction({ kind: "comments", reviewId: r.id, clientId: (r as any).client_id, title: r.title, designPath: r.design_path, author, channel: r.slack_channel, thread: r.slack_thread, count: open.length });
          return json(res, 200, { ok: true, count: open.length });
        }
      }
      return send(res, 404, "Not found");
    } catch (e: any) {
      console.error("[web]", e.message);
      return json(res, 500, { error: "Something went wrong." });
    }
  });
  server.listen(port, () => console.log(`Review pages on port ${port} (public: ${process.env.PUBLIC_URL || "set PUBLIC_URL"})`));
}

export const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Design review</title>
<style>
:root{--bg:#f4f2ee;--panel:#fff;--ink:#1d1d1d;--muted:#6b6b6b;--line:#e4e0d8;--accent:#E03400;--ok:#1a7f37}
*{box-sizing:border-box}html,body{overflow-x:hidden}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
header{position:sticky;top:0;z-index:5;background:var(--panel);border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:10px 16px}
header h1{font-size:16px;margin:0;flex:1 1 220px}header small{color:var(--muted);font-weight:400;display:block}
.pill{border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600}.pill.review{background:#fff3e0;color:#9a4b00}.pill.ok{background:#e7f6ec;color:var(--ok)}
button,select{font:inherit;border:1px solid var(--line);background:#fff;border-radius:8px;padding:7px 12px;cursor:pointer;min-height:36px}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff}a.btn{font:inherit;border:1px solid var(--line);background:#fff;border-radius:8px;padding:7px 12px;min-height:36px;display:inline-flex;align-items:center;color:inherit;text-decoration:none}button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
main{display:flex;flex-wrap:wrap;gap:20px;padding:20px 16px;justify-content:center;align-items:flex-start}
.stage{position:relative;flex:0 0 auto}.stage iframe{display:block;border:0;width:600px;background:#fff;box-shadow:0 2px 20px rgba(0,0,0,.08)}
.overlay{position:absolute;inset:0;cursor:crosshair;display:none}.commenting .overlay{display:block}
.pin{position:absolute;width:28px;height:28px;margin:-28px 0 0 0;border-radius:50% 50% 50% 0;background:var(--accent);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer;z-index:2}
.pin.done{background:#9b9b9b}.pin.sel{outline:3px solid #1d1d1d}
aside{flex:1 1 320px;max-width:420px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px}
aside h2{font-size:14px;margin:0 0 10px}.c{border-top:1px solid var(--line);padding:10px 0}.c.sel{background:#fff8f3}
.c .who{font-weight:600;font-size:13px}.c .who em{font-style:normal;color:var(--muted);font-weight:400}.c p{margin:4px 0;white-space:pre-wrap;word-wrap:break-word}
.r{margin:6px 0 0 14px;padding-left:10px;border-left:2px solid var(--line)}.r.bot .who{color:var(--accent)}
.row{display:flex;gap:6px;margin-top:6px}textarea{font:inherit;width:100%;border:1px solid var(--line);border-radius:8px;padding:8px;min-height:60px;resize:vertical}
.hint{color:var(--muted);font-size:13px}
#fit{flex:0 0 auto;max-width:100%;overflow:hidden}.stage{transform-origin:top left;width:600px}
#composer{position:absolute;z-index:20;width:280px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px;box-shadow:0 8px 30px rgba(0,0,0,.18);display:none}#composer textarea{font-size:16px}#chint{display:none;margin-bottom:6px}.pin.pending{background:#1d1d1d}
@media (max-width:700px){#composer{position:fixed;left:0;right:0;bottom:0;top:auto!important;width:auto;border-radius:16px 16px 0 0;padding:14px max(16px,env(safe-area-inset-left)) calc(14px + env(safe-area-inset-bottom));box-shadow:0 -8px 30px rgba(0,0,0,.2)}#chint{display:block}}
@media (max-width:700px){main{padding:12px 8px}aside{max-width:none}}
</style></head><body>
<header><h1 id="t">Loading…<small id="sub"></small></h1>
<span id="status" class="pill review"></span>
<select id="ver" aria-label="Version"></select>
<button id="view">Mobile view</button>
<button id="cm" class="on">Comment</button>
<a id="dl" class="btn" download>Download JPEG</a>
<button id="sc">Submit comments</button>
<button id="ap" class="primary">Approve &amp; build</button></header>
<main id="main"><div id="fit"><div class="stage" id="stage"><iframe id="f" title="Email design" scrolling="no"></iframe><div class="overlay" id="ov"></div></div></div>
<div id="composer"><div class="hint" id="chint">Comment on the marked spot</div><textarea id="ctext" placeholder="What should change here?"></textarea><div class="row"><button class="primary" id="csave">Comment</button><button id="ccancel">Cancel</button></div></div>
<aside><h2>Comments</h2><div class="hint" id="hint">Click anywhere on the email to leave a comment. Turn "Comment" off to click the email's links.</div><div id="list"></div></aside></main>
<script>
const token=location.pathname.split("/")[2];let S=null,ver=null,sel=null,pending=null;
const $=(id)=>document.getElementById(id);
const esc=(s)=>String(s).replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function who(){let n=localStorage.getItem("fluid-review-name");if(!n){n=(prompt("Your name (shown next to your comments):")||"").trim();if(n)localStorage.setItem("fluid-review-name",n)}return n}
async function api(p,b){const r=await fetch("/r/"+token+p,b?{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}:{});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"Something went wrong");return j}
async function load(keep){S=await api("/data");if(!keep||ver===null)ver=S.current;$("t").firstChild.nodeValue=S.title;$("sub").textContent=S.client+" · design review";
const ok=S.status==="approved"&&S.approved_version===S.current,building=ok&&S.build_state==="queued",built=ok&&S.build_state==="built";
$("status").className="pill "+(S.working?"review":ok?"ok":"review");$("status").textContent=S.working?"Fluid is updating this email…":building?"Approved · building in Klaviyo…":built?"Approved · draft in Klaviyo":ok?"Approved by "+S.approved_by:"Waiting for approval";
const sty=/^style options\\s+email/i.test(S.title);if(sty)$("status").textContent=S.working?"Fluid is updating this email…":ok?"Chosen by "+S.approved_by:"Style option";
$("ap").disabled=ok||S.working;$("ap").textContent=sty?(ok?"Chosen":"Choose this style"):ok?"Approved":"Approve & build";
const n=newOpen().length;$("sc").disabled=!n||S.working;$("sc").textContent=S.working?"Working on comments…":n?"Submit comments ("+n+")":"Submit comments";
$("ver").innerHTML=S.versions.map(v=>'<option value="'+v.version+'"'+(v.version===ver?" selected":"")+">Version "+v.version+(v.version===S.current?" (latest)":"")+"</option>").join("");render()}
let H=0,mobile=false;
function fit(){const avail=Math.min(document.documentElement.clientWidth-16,mobile?375:600),k=Math.min(1,avail/600);$("stage").style.transform="scale("+k+")";$("fit").style.width=600*k+"px";$("fit").style.height=H*k+"px"}
function frame(){$("dl").href="/r/"+token+"/jpeg?v="+ver;const f=$("f");f.onload=()=>{H=f.contentDocument.documentElement.scrollHeight;f.style.height=H+"px";$("ov").style.height=H+"px";fit();pins()};f.src="/r/"+token+"/frame?v="+ver}
let lastW=document.documentElement.clientWidth;addEventListener("resize",()=>{const w=document.documentElement.clientWidth;if(w!==lastW){lastW=w;fit()}});
function tops(){return S.comments.filter(c=>!c.parent_id&&c.version===ver)}
function newOpen(){return S.comments.filter(c=>!c.parent_id&&c.version===S.current&&!c.resolved&&!c.submitted_at)}
function pins(){document.querySelectorAll(".pin:not(.pending)").forEach(p=>p.remove());tops().forEach((c,i)=>{const p=document.createElement("div");p.className="pin"+(c.resolved?" done":"")+(sel===c.id?" sel":"");p.style.left=c.x+"px";p.style.top=c.y+"px";p.textContent=i+1;p.onclick=(e)=>{e.stopPropagation();sel=c.id;render()};$("stage").appendChild(p)})}
function render(){pins();const list=tops();$("list").innerHTML=list.length?list.map((c,i)=>{const rs=S.comments.filter(x=>x.parent_id===c.id);return '<div class="c'+(sel===c.id?" sel":"")+'" data-id="'+c.id+'"><div class="who">'+(i+1)+". "+esc(c.author_name)+(c.resolved?" <em>· resolved</em>":"")+'</div><p>'+esc(c.body)+"</p>"+rs.map(r=>'<div class="r'+(r.author_kind==="bot"?" bot":"")+'"><div class="who">'+esc(r.author_kind==="bot"?"Fluid":r.author_name)+"</div><p>"+esc(r.body)+"</p></div>").join("")+'<div class="row"><button data-reply="'+c.id+'">Reply</button><button data-res="'+c.id+'">'+(c.resolved?"Reopen":"Resolve")+"</button></div></div>"}).join(""):'<p class="hint">No comments on this version yet.</p>';}
$("list").onclick=async(e)=>{const id=e.target.dataset.reply,rid=e.target.dataset.res;if(id){const n=who();if(!n)return;const t=(prompt("Your reply:")||"").trim();if(!t)return;await api("/comments",{author:n,body:t,parent_id:id,version:ver}).catch(a=>alert(a.message));await load(true)}if(rid){const c=S.comments.find(x=>x.id===rid);await api("/resolve",{author:who()||"Reviewer",comment_id:rid,resolved:!c.resolved});await load(true)}const box=e.target.closest(".c");if(box&&!id&&!rid){sel=box.dataset.id;render()}};
function clearPending(){const p=document.querySelector(".pin.pending");if(p)p.remove();$("composer").style.display="none";pending=null}
$("ov").onclick=(e)=>{const r=$("ov").getBoundingClientRect(),k=600/r.width;pending={x:Math.round((e.clientX-r.left)*k),y:Math.round((e.clientY-r.top)*k)};
const old=document.querySelector(".pin.pending");if(old)old.remove();const pp=document.createElement("div");pp.className="pin pending";pp.style.left=pending.x+"px";pp.style.top=pending.y+"px";pp.textContent="+";$("stage").appendChild(pp);
const c=$("composer"),narrow=matchMedia("(max-width:700px)").matches;c.style.display="block";$("ctext").value="";
if(!narrow){c.style.left=Math.max(8,Math.min(e.pageX-140,document.documentElement.clientWidth-296))+"px";c.style.top=(e.pageY+18)+"px"}
$("ctext").focus({preventScroll:true})};
$("ccancel").onclick=clearPending;
$("csave").onclick=async()=>{const n=who();if(!n||!pending)return;const t=$("ctext").value.trim();if(!t)return;try{await api("/comments",{author:n,body:t,x:pending.x,y:pending.y,version:ver});clearPending();await load(true)}catch(a){alert(a.message)}};
$("cm").onclick=()=>{$("main").classList.toggle("commenting");$("cm").classList.toggle("on")};$("main").classList.add("commenting");
$("view").onclick=()=>{mobile=!mobile;$("view").textContent=mobile?"Desktop view":"Mobile view";fit()};
$("ver").onchange=()=>{ver=Number($("ver").value);sel=null;frame();render()};
$("ap").onclick=async()=>{const n=who();if(!n)return;if(/^style options\\s+email/i.test(S.title)){const nm=S.title.split(/\\s+[—–-]\\s+/).slice(1).join(" — ")||"this";if(!confirm("Choose the "+nm+" style for all of your emails? (Every email still gets its own design, at this level of graphics.)"))return;try{await api("/approve",{author:n,build:false});alert("Thanks! Fluid will design your emails in the "+nm+" style from now on.")}catch(a){alert(a.message)}await load(true);return}const waiting=newOpen().length;
if(!confirm((waiting?"You have "+waiting+" comment"+(waiting>1?"s":"")+" you haven't submitted. They won't be made.\\n\\n":"")+"Approve version "+S.current+" and build it in Klaviyo as a draft? (Nothing is sent or scheduled.)"))return;
try{const r=await api("/approve",{author:n,build:true});alert(r.building==="email"?"Approved. Fluid is building it in Klaviyo as a draft now, and will post in Slack when it's done.":r.building==="flow"?"Approved. Every email in this flow is approved, so Fluid is building the whole flow in Klaviyo as a draft now.":"Approved. The flow builds in Klaviyo once the other "+r.waiting+" email"+(r.waiting>1?"s are":" is")+" approved.")}catch(a){alert(a.message)}await load(true)};
$("sc").onclick=async()=>{const n=who();if(!n)return;const k=newOpen().length;if(!k)return;if(!confirm("Send "+k+" comment"+(k>1?"s":"")+" to Fluid? It will make the changes and post a new version here."))return;
try{await api("/submit",{author:n});}catch(a){alert(a.message)}await load(true)};
load().then(frame).catch(e=>{document.body.innerHTML="<p style='padding:24px'>"+esc(e.message)+"</p>"});
setInterval(()=>load(true).catch(()=>{}),30000);
</script></body></html>`;

const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const BASE_CSS = `:root{--ink:#1d1d1d;--muted:#666;--line:#e4e0d8;--accent:#E03400}*{box-sizing:border-box}html,body{overflow-x:hidden}body{margin:0;background:#f6f4ef;color:var(--ink);font:18px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}.wrap{max-width:980px;margin:0 auto;padding:40px 20px 80px}h1{font-size:36px;line-height:1.15;margin:0 0 10px}.sub{color:var(--muted);margin:0 0 32px;font-size:19px}`;

export function docPage(title: string, client: string, html: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(title)}</title>
<style>${BASE_CSS}.doc{background:#fff;border:1px solid var(--line);border-radius:12px;padding:28px 28px 36px}.doc h1{font-size:26px}.doc h2{font-size:20px;margin:28px 0 8px;padding-top:16px;border-top:1px solid var(--line)}.doc h3{font-size:17px;margin:20px 0 6px}.doc table{border-collapse:collapse;width:100%;display:block;overflow-x:auto;font-size:14px}.doc th,.doc td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}.doc th{background:#faf8f4}.doc pre{white-space:pre-wrap;background:#faf8f4;border:1px solid var(--line);border-radius:8px;padding:12px;font-size:13.5px}.doc code{font-size:13.5px}.doc blockquote{margin:0;padding-left:12px;border-left:3px solid var(--line);color:var(--muted)}@media(max-width:600px){.doc{padding:18px}}</style></head>
<body><div class="wrap"><p class="sub">${esc(client)} · prepared by Fluid Creatives</p><div class="doc">${html}</div></div></body></html>`;
}

export function formPage(client: string, keyOnly = false) {
  const field = (q: any) => {
    const req = q.required ? " required" : "";
    const label = `<label for="${q.id}">${esc(q.label)}${q.required ? ' <span class="req">*</span>' : ""}</label>${q.help ? `<div class="help">${esc(q.help)}</div>` : ""}`;
    if (q.type === "connection") return `<div class="q">${label.replace(`for="${q.id}"`, 'for="klaviyo_key"')}<div class="help">Klaviyo → Settings → API keys → Create Private API Key → choose <b>Read-only access</b> for everything (Full access only if you've agreed Fluid will build drafts and segments for you). Paste it here: it's stored encrypted and only used by Fluid's systems.</div><input id="klaviyo_key" name="klaviyo_key" type="password" autocomplete="off" placeholder="pk_…"></div>`;
    if (q.type === "textarea" || q.type === "list") return `<div class="q">${label}<textarea id="${q.id}" name="${q.id}" rows="${q.type === "list" ? 4 : 3}"${req} placeholder="${esc(q.placeholder ?? (q.type === "list" ? "One per line" : ""))}"></textarea></div>`;
    if (q.type === "choice") return `<div class="q">${label}<select id="${q.id}" name="${q.id}"${req}><option value="">Choose…</option>${(q.options ?? []).map((o: string) => `<option>${esc(o)}</option>`).join("")}</select></div>`;
    const type = q.type === "url" ? "url" : q.type === "email" ? "email" : q.type === "number" || q.type === "percent" ? "number" : "text";
    return `<div class="q">${label}<input id="${q.id}" name="${q.id}" type="${type}"${req} placeholder="${esc(q.placeholder ?? "")}"></div>`;
  };
  const keyQ = formSections().flatMap((x) => x.questions).find((q) => q.type === "connection");
  const sections = keyOnly
    ? `<section><h2>Connect Klaviyo</h2><p class="help">We already have your onboarding answers, so this is all we need: a Klaviyo key, so we can review your flows, campaigns and results.</p>${keyQ ? field(keyQ) : ""}<div class="q"><label for="notes">Anything new since your onboarding form? (optional)</label><textarea id="notes" name="notes" rows="3" placeholder="New products, offers, dates…"></textarea></div></section>`
    : formSections().map((s) => `<section><h2>${esc(s.title)}</h2>${s.intro ? `<p class="help">${esc(s.intro)}</p>` : ""}${s.questions.map(field).join("")}</section>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(client)} onboarding</title>
<style>${BASE_CSS}section{background:#fff;border:1px solid var(--line);border-radius:14px;padding:32px 36px;margin-bottom:20px}h2{font-size:24px;margin:0 0 6px}.q{margin-top:24px}label{display:block;font-weight:650;font-size:18px}.req{color:var(--accent)}.help{color:var(--muted);font-size:16px;margin:4px 0 8px}input,textarea,select{width:100%;font:inherit;font-size:18px;border:1px solid #d9d4ca;border-radius:10px;padding:14px 16px;background:#fff;min-height:54px}textarea{min-height:120px}button{font:inherit;font-weight:650;font-size:19px;background:var(--accent);color:#fff;border:0;border-radius:10px;padding:18px 24px;min-height:60px;cursor:pointer;width:100%}#msg{margin-top:14px;font-weight:600}@media(max-width:600px){section{padding:22px 18px}h1{font-size:28px}}</style></head>
<body><div class="wrap"><h1>${esc(client)} × Fluid Creatives</h1><p class="sub">${keyOnly ? "One last step to finish your onboarding." : "Tell us about your brand. It takes about 15 minutes, and it's what everything we write and design for you is built on."}</p>
<form id="f">${sections}<button type="submit" id="go">${keyOnly ? "Connect Klaviyo" : "Send to Fluid"}</button><div id="msg"></div></form></div>
<script>
const f=document.getElementById("f"),msg=document.getElementById("msg"),go=document.getElementById("go");
f.onsubmit=async(e)=>{e.preventDefault();go.disabled=true;msg.textContent="Sending…";const a={};for(const el of f.elements){if(!el.name||el.name==="klaviyo_key")continue;a[el.name]=el.value}
try{const r=await fetch(location.pathname+"/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({answers:a,klaviyo_key:f.elements.klaviyo_key?f.elements.klaviyo_key.value:""})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Something went wrong");f.innerHTML="<section><h2>Thank you!</h2><p>We've got everything. Your Fluid team will be in touch with your onboarding doc and first campaigns shortly.</p></section>"}catch(err){msg.textContent=err.message;go.disabled=false}};
</script></body></html>`;
}

/** Internal onboarding page (Fluid team only): the client's onboarding doc (PDF) + optional Klaviyo / Customer.io key. */
export function internalPage(client: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(client)} onboarding</title>
<style>${BASE_CSS}section{background:#fff;border:1px solid var(--line);border-radius:14px;padding:32px 36px;margin-bottom:20px}h2{font-size:24px;margin:0 0 6px}.q{margin-top:22px}label{display:block;font-weight:650;font-size:18px}.help{color:var(--muted);font-size:16px;margin:4px 0 8px}input[type=password],input[type=text],textarea{width:100%;font:inherit;font-size:18px;border:1px solid #d9d4ca;border-radius:10px;padding:14px 16px;background:#fff;min-height:54px}textarea{min-height:110px}
.drop{border:2px dashed #cfc8bb;border-radius:12px;padding:34px 18px;text-align:center;cursor:pointer;color:var(--muted)}.drop.over{border-color:var(--accent);background:#fff6f2}.drop b{color:var(--ink);font-size:19px}#files{list-style:none;padding:0;margin:10px 0 0}#files li{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:16px}#files li span:last-child{color:var(--muted);white-space:nowrap}
.seg{display:flex;flex-wrap:wrap;gap:8px}.seg label{font-weight:600;font-size:17px;border:1px solid #d9d4ca;border-radius:999px;padding:10px 18px;cursor:pointer}.seg input{position:absolute;opacity:0}.seg input:checked+span{color:#fff}.seg label:has(input:checked){background:var(--ink);border-color:var(--ink);color:#fff}.seg input:focus-visible+span{outline:2px solid var(--accent);outline-offset:4px}
button{font:inherit;font-weight:650;font-size:19px;background:var(--accent);color:#fff;border:0;border-radius:10px;padding:18px 24px;min-height:60px;cursor:pointer;width:100%}#msg{margin-top:14px;font-weight:600}.tag{display:inline-block;background:#1d1d1d;color:#fff;border-radius:999px;font-size:13px;padding:3px 10px;margin-bottom:12px}@media(max-width:600px){section{padding:22px 18px}h1{font-size:28px}}</style></head>
<body><div class="wrap"><span class="tag">Fluid team only</span><h1>Onboard ${esc(client)}</h1><p class="sub">Upload the client's onboarding doc. The onboarding runs in their Slack channel as soon as you save.</p>
<form id="f"><section><h2>Onboarding doc</h2><p class="help">The PDF with their onboarding answers. Add brand guidelines or other files too if you have them (PDF, images, Word, PowerPoint; up to 30 MB each).</p>
<div class="drop" id="drop"><b>Drop the PDF here</b><br>or click to choose<input id="pick" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.pptx,.txt,.md" hidden></div><ul id="files"></ul></section>
<section><h2>Email platform <span style="font-weight:400;color:var(--muted);font-size:17px">(optional)</span></h2><p class="help">Connect it now or later. Without a key, the onboarding works from the doc and their website.</p>
<div class="seg" role="radiogroup" aria-label="Email platform"><label><input type="radio" name="platform" value="klaviyo" id="p-k"><span>Klaviyo</span></label><label><input type="radio" name="platform" value="customerio" id="p-c"><span>Customer.io</span></label><label><input type="radio" name="platform" value="none" id="p-n" checked><span>Not now</span></label></div>
<div class="q" id="keybox" hidden><label for="key" id="keylabel">API key</label><div class="help" id="keyhelp"></div><input id="key" type="password" autocomplete="off"></div></section>
<section><h2>Shopify <span style="font-weight:400;color:var(--muted);font-size:17px">(optional)</span></h2><p class="help">For the store analytics audit, and so Fluid can create discount codes. On their store: Shopify Dev Dashboard → their app (scopes: ${"read_orders, read_all_orders, read_products, read_customers, read_reports, write_discounts"}) → Settings → Client ID and Client secret. Or paste an Admin API token instead of the secret.</p>
<div class="q"><label for="shop">Store address</label><input id="shop" type="text" placeholder="brand.myshopify.com" autocomplete="off"></div>
<div class="q"><label for="sid">App Client ID</label><input id="sid" type="text" autocomplete="off" placeholder="Leave empty if you paste an Admin API token"></div>
<div class="q"><label for="ssec">Client secret or Admin API token</label><input id="ssec" type="password" autocomplete="off" placeholder="shpss_… or shpat_…"></div></section>
<section><h2>Notes <span style="font-weight:400;color:var(--muted);font-size:17px">(optional)</span></h2><div class="q" style="margin-top:6px"><textarea id="notes" name="notes" placeholder="Anything the doc doesn't say: current offers, sender name, what to avoid…"></textarea></div></section>
<button type="submit" id="go">Save and start onboarding</button><div id="msg"></div></form></div>
<script>
const f=document.getElementById("f"),msg=document.getElementById("msg"),go=document.getElementById("go"),drop=document.getElementById("drop"),pick=document.getElementById("pick"),list=document.getElementById("files");let queue=[];
const HELP={klaviyo:["Klaviyo private API key","Klaviyo → Settings → API keys → Create Private API Key. Read-only is enough for the audit; Full access if we'll build drafts. Starts with pk_.","pk_…"],customerio:["Customer.io App API key","Customer.io → Settings → API Credentials → App API Keys → Create. Stored encrypted; we only create drafts, never send.",""]};
for(const r of f.elements.platform){r.onchange=()=>{const p=f.elements.platform.value,h=HELP[p];document.getElementById("keybox").hidden=!h;if(h){document.getElementById("keylabel").textContent=h[0];document.getElementById("keyhelp").textContent=h[1];document.getElementById("key").placeholder=h[2]}}}
const kb=(n)=>n>1048576?(n/1048576).toFixed(1)+" MB":Math.ceil(n/1024)+" KB";
function add(fs){for(const x of fs){if(x.size>30*1048576){msg.textContent=x.name+" is over 30 MB";continue}queue.push(x)}show()}
function show(){list.innerHTML=queue.map((x,i)=>"<li><span>"+x.name.replace(/</g,"&lt;")+"</span><span id='s"+i+"'>"+kb(x.size)+"</span></li>").join("")}
drop.onclick=()=>pick.click();pick.onchange=()=>add(pick.files);
drop.ondragover=(e)=>{e.preventDefault();drop.classList.add("over")};drop.ondragleave=()=>drop.classList.remove("over");drop.ondrop=(e)=>{e.preventDefault();drop.classList.remove("over");add(e.dataTransfer.files)};
f.onsubmit=async(e)=>{e.preventDefault();if(!queue.length){msg.textContent="Add the onboarding doc first.";return}go.disabled=true;
try{for(let i=0;i<queue.length;i++){const x=queue[i];if(x.done)continue;document.getElementById("s"+i).textContent="Uploading…";msg.textContent="Uploading "+(i+1)+" of "+queue.length+"…";
const r=await fetch(location.pathname+"/upload?name="+encodeURIComponent(x.name),{method:"POST",body:x});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"Upload failed");x.done=true;document.getElementById("s"+i).textContent="✓ Uploaded"}
msg.textContent="Saving…";const platform=f.elements.platform.value;
const r=await fetch(location.pathname+"/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({answers:{platform,notes:f.elements.notes.value},klaviyo_key:platform==="none"?"":document.getElementById("key").value,shopify:{shop:document.getElementById("shop").value,client_id:document.getElementById("sid").value,secret:document.getElementById("ssec").value}})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Something went wrong");
f.innerHTML="<section><h2>Saved</h2><p>The onboarding is starting in ${esc(client)}'s Slack channel. Updates and the doc links will be posted there.</p></section>"}catch(err){msg.textContent=err.message;go.disabled=false}};
</script></body></html>`;
}

/** Flow review page: a sticky "Go to email #" bar with arrows; the selected email's full review page (comments, approve) below. */
export function flowPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Flow review</title>
<style>:root{--bg:#f4f2ee;--panel:#fff;--ink:#1d1d1d;--muted:#6b6b6b;--line:#e4e0d8;--accent:#E03400;--ok:#1a7f37}*{box-sizing:border-box}html,body{height:100%;margin:0}body{background:var(--bg);color:var(--ink);font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;display:flex;flex-direction:column}
.bar{background:var(--panel);border-bottom:1px solid var(--line);padding:10px 16px;display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}
.bar h1{font-size:16px;margin:0;flex:1 1 200px}.bar h1 small{display:block;color:var(--muted);font-weight:400;font-size:13px}
.go{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.go span{color:var(--muted);font-size:13px;font-weight:600;margin-right:2px}
.go button{font:inherit;font-weight:650;border:1px solid var(--line);background:#fff;border-radius:999px;min-width:40px;height:36px;padding:0 12px;cursor:pointer;position:relative}
.go button.on{background:var(--ink);color:#fff;border-color:var(--ink)}.go button.ok::after{content:"";position:absolute;top:3px;right:3px;width:8px;height:8px;border-radius:50%;background:var(--ok)}
.go .arrow{font-size:18px;min-width:36px;padding:0}.go .arrow:disabled{opacity:.35;cursor:default}
.now{width:100%;color:var(--muted);font-size:13px}.now b{color:var(--ink)}
iframe{flex:1;width:100%;border:0;background:var(--bg)}
button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}</style></head>
<body><div class="bar"><h1 id="t">Loading…<small id="sub"></small></h1><div class="go" id="go"></div><div class="now" id="now"></div></div><iframe id="f" title="Email review"></iframe>
<script>
const token=location.pathname.split("/")[2];let D=null,i=0;const $=(id)=>document.getElementById(id);
const esc=(s)=>String(s).replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function pick(){const h=decodeURIComponent(location.hash.slice(1)).replace(/^email-/,"");const k=D.emails.findIndex(e=>e.label.replace(/[# ]/g,"")===h.replace(/[# ]/g,""));return k>=0?k:0}
function bar(){const n=D.emails.length,sty=/^style options$/i.test(D.flow);$("go").innerHTML='<span>'+(sty?"Style":"Go to email")+'</span><button class="arrow" id="prev" aria-label="Previous email" '+(i===0?"disabled":"")+'>←</button>'+D.emails.map((e,k)=>'<button data-k="'+k+'" class="'+(k===i?"on ":"")+(e.approved?"ok":"")+'" title="'+esc(e.title)+(e.approved?" (approved)":"")+'">'+esc(e.label)+'</button>').join("")+'<button class="arrow" id="next" aria-label="Next email" '+(i===n-1?"disabled":"")+'>→</button>';
const e=D.emails[i];$("now").innerHTML="<b>"+(sty?"Option ":"Email ")+esc(e.label)+"</b> · "+esc(e.title)+(e.approved?(sty?" · ✓ chosen":" · ✓ approved"):"");
$("prev").onclick=()=>go(i-1);$("next").onclick=()=>go(i+1);$("go").querySelectorAll("button[data-k]").forEach(b=>b.onclick=()=>go(+b.dataset.k))}
function go(k){if(k<0||k>=D.emails.length)return;i=k;history.replaceState(null,"","#email-"+D.emails[i].label.replace(/[# ]/g,""));$("f").src="/r/"+D.emails[i].token;bar()}
async function load(first){const r=await fetch(location.pathname+"/data");D=await r.json();if(!D.emails.length){document.body.innerHTML="<p style='padding:24px'>No emails in this flow yet.</p>";return}
const sty=/^style options$/i.test(D.flow);$("t").firstChild.nodeValue=sty?"Pick your email style":D.flow+" flow";$("sub").textContent=sty?D.client+" · the same email in "+D.emails.length+" styles. Open each one and click \u201cChoose this style\u201d on your favorite.":D.client+" · "+D.emails.length+" emails · "+D.emails.filter(e=>e.approved).length+" approved";if(first){go(pick())}else bar()}
addEventListener("keydown",(e)=>{if(e.target.tagName==="TEXTAREA"||e.target.tagName==="INPUT")return;if(e.key==="ArrowRight")go(i+1);if(e.key==="ArrowLeft")go(i-1)});
load(true).catch(()=>{document.body.innerHTML="<p style='padding:24px'>Couldn't load this flow.</p>"});setInterval(()=>load(false).catch(()=>{}),30000);
</script></body></html>`;
}

/** Campaign calendar page: month grid opening on today, colour-coded sends, click one for its full brief. */
export function calendarPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Campaign calendar</title>
<style>
:root{--bg:#f5f3ef;--panel:#fff;--ink:#1c1b19;--muted:#6d6a62;--line:#e5e1d8;--today:#1c1b19;--value:#1f8a70;--value-bg:#e3f3ee;--promo:#d9472b;--promo-bg:#fde9e4;--sms:#6b4fd0;--sms-bg:#ece7fb}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
.wrap{max-width:1240px;margin:0 auto;padding:24px 16px 60px}
header{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px 20px;margin-bottom:16px}
header h1{font-size:24px;line-height:1.2;margin:0;flex:1 1 360px;text-wrap:balance}header h1 small{display:block;font-size:14px;color:var(--muted);font-weight:400;margin-top:4px}
.legend{display:flex;flex-wrap:wrap;gap:8px 14px;font-size:13px;color:var(--muted)}.legend span{display:inline-flex;align-items:center;gap:6px}.dot{width:10px;height:10px;border-radius:3px;display:inline-block}
.nav{display:flex;align-items:center;gap:8px;margin:6px 0 12px}.nav h2{font-size:18px;margin:0 8px 0 0;min-width:150px}
button{font:inherit;border:1px solid var(--line);background:#fff;border-radius:8px;padding:6px 12px;cursor:pointer;color:inherit}button:focus-visible,.chip:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));background:var(--line);gap:1px;border:1px solid var(--line);border-radius:12px;overflow:hidden}
.dow{background:#faf8f4;padding:8px 10px;font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.day{background:var(--panel);min-height:118px;padding:6px 6px 8px;display:flex;flex-direction:column;gap:4px;min-width:0}.day.out{background:#fbfaf7}.day.out .n{color:#bbb5a8}
.n{font-size:12px;font-weight:600;color:var(--muted);padding:2px 4px;align-self:flex-start;border-radius:999px}.day.today .n{background:var(--today);color:#fff;padding:2px 8px}
.chip{display:block;width:100%;text-align:left;border:0;border-left:3px solid;border-radius:6px;padding:5px 7px;font-size:12px;line-height:1.3;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip.value{background:var(--value-bg);border-color:var(--value);color:#0f4f40}.chip.promo{background:var(--promo-bg);border-color:var(--promo);color:#8a2512}.chip.sms{background:var(--sms-bg);border-color:var(--sms);color:#3d2a8a}
.chip b{font-weight:650;margin-right:4px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;opacity:.75}
.extra{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:20px}.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px}.card h3{margin:0 0 6px;font-size:15px}.card ul{padding-left:18px;margin:6px 0}.card p{margin:6px 0}
.agenda{display:none}
#scrim{position:fixed;inset:0;background:rgba(20,18,15,.35);opacity:0;pointer-events:none;transition:opacity .15s}#scrim.on{opacity:1;pointer-events:auto}
#drawer{position:fixed;top:0;right:0;bottom:0;width:min(440px,100%);background:var(--panel);transform:translateX(100%);visibility:hidden;transition:transform .2s ease,visibility 0s .2s;overflow-y:auto;padding:22px 22px 40px;z-index:5}#drawer.on{transform:none;visibility:visible;box-shadow:-10px 0 40px rgba(0,0,0,.15);transition:transform .2s ease}
#drawer .top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}#drawer h3{font-size:20px;line-height:1.25;margin:6px 0 4px}.when{color:var(--muted);font-size:13px}
.badges{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 14px}.badge{font-size:12px;font-weight:600;border-radius:999px;padding:3px 10px}.badge.value{background:var(--value-bg);color:#0f4f40}.badge.promo{background:var(--promo-bg);color:#8a2512}.badge.sms{background:var(--sms-bg);color:#3d2a8a}.badge.email{background:#efece5;color:#4b483f}
dl{margin:0;display:grid;gap:12px}dd.unset{color:#b3ad9f;font-style:italic}dt{font-size:12px;font-weight:650;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}dd{margin:2px 0 0}
a.open{display:inline-block;margin-top:16px;background:var(--ink);color:#fff;text-decoration:none;border-radius:8px;padding:9px 14px;font-weight:600}
@media (prefers-reduced-motion:reduce){#drawer,#scrim{transition:none}}
@media (max-width:760px){.grid,.nav .mview{display:none}.agenda{display:block}.agenda .wk{margin:14px 0 6px;font-size:12px;font-weight:650;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.agenda .row{display:flex;gap:10px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin-bottom:6px}.agenda .d{min-width:52px;font-weight:650;font-size:13px}.agenda .d small{display:block;color:var(--muted);font-weight:400}.agenda .row.today{border-color:var(--ink)}.agenda .chips{flex:1;display:flex;flex-direction:column;gap:4px;min-width:0}.chip{white-space:normal}}
</style></head><body><div class="wrap">
<header><h1 id="t">Loading…<small id="sub"></small></h1><div class="legend"><span><i class="dot" style="background:var(--value)"></i>Value / education / social proof</span><span><i class="dot" style="background:var(--promo)"></i>Sales / promo</span><span><i class="dot" style="background:var(--sms)"></i>SMS</span></div></header>
<div class="nav"><h2 id="m"></h2><button id="prev" aria-label="Previous month">←</button><button id="today">Today</button><button id="next" aria-label="Next month">→</button></div>
<div class="grid" id="grid"></div><div class="agenda" id="agenda"></div><div class="extra" id="extra"></div></div>
<div id="scrim"></div><aside id="drawer" aria-hidden="true"></aside>
<script>
const token=location.pathname.split("/")[2];let D=null,view=null;const $=(id)=>document.getElementById(id);
const esc=(s)=>String(s??"").replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const iso=(d)=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const todayIso=iso(new Date());const MON=["January","February","March","April","May","June","July","August","September","October","November","December"];
function chips(date){const out=[];D.sends.forEach((s,k)=>{if(s.date!==date)return;if(s.channel!=="sms")out.push('<button class="chip '+s.type+'" data-k="'+k+'" title="'+esc(s.title)+'"><b>'+(s.type==="promo"?"Promo":"Email")+'</b>'+esc(s.title)+'</button>');if(s.channel!=="email")out.push('<button class="chip sms" data-k="'+k+'" title="'+esc(s.title)+'"><b>SMS</b>'+esc(s.title)+'</button>')});return out.join("")}
function render(){const y=view.getFullYear(),mo=view.getMonth();$("m").textContent=MON[mo]+" "+y;
const first=new Date(y,mo,1),start=new Date(first);start.setDate(1-((first.getDay()+6)%7));
let h=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>'<div class="dow">'+d+'</div>').join("");
for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);if(i%7===0&&i>=28&&d.getMonth()!==mo)break;const di=iso(d);h+='<div class="day'+(d.getMonth()!==mo?" out":"")+(di===todayIso?" today":"")+'"><span class="n">'+d.getDate()+'</span>'+chips(di)+'</div>'}
$("grid").innerHTML=h;
const ag=D.sends.map(s=>s.date).filter((v,i,a)=>a.indexOf(v)===i).sort().filter(di=>{const d=new Date(di+"T12:00");return d.getMonth()===mo&&d.getFullYear()===y});
$("agenda").innerHTML=ag.length?ag.map(di=>{const d=new Date(di+"T12:00");return '<div class="row'+(di===todayIso?" today":"")+'"><div class="d">'+["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]+'<small>'+MON[d.getMonth()].slice(0,3)+" "+d.getDate()+'</small></div><div class="chips">'+chips(di)+'</div></div>'}).join(""):'<p style="color:var(--muted)">Nothing planned this month.</p>';
document.querySelectorAll(".chip").forEach(b=>b.onclick=()=>open(+b.dataset.k))}
function open(k){const s=D.sends[k];const d=new Date(s.date+"T12:00");
$("drawer").innerHTML='<div class="top"><div class="when">'+d.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})+'</div><button id="close" aria-label="Close">✕</button></div><h3>'+esc(s.title)+'</h3>'+(s.note?'<div class="when">'+esc(s.note)+'</div>':'')+
'<div class="badges"><span class="badge '+s.type+'">'+(s.type==="promo"?"Sales / promo":"Value")+'</span>'+(s.channel!=="sms"?'<span class="badge email">Email</span>':'')+(s.channel!=="email"?'<span class="badge sms">SMS</span>':'')+'</div>'+
'<dl>'+s.fields.map(f=>'<div><dt>'+esc(f.label)+'</dt><dd'+(f.value?'':' class="unset"')+'>'+(f.value?esc(f.value):'Not set')+'</dd></div>').join("")+'</dl>'+(s.link?'<a class="open" href="'+esc(s.link)+'" target="_blank" rel="noopener">Open the design</a>':'');
$("drawer").classList.add("on");$("drawer").setAttribute("aria-hidden","false");$("scrim").classList.add("on");$("close").onclick=close;$("close").focus()}
function close(){$("drawer").classList.remove("on");$("drawer").setAttribute("aria-hidden","true");$("scrim").classList.remove("on")}
$("scrim").onclick=close;addEventListener("keydown",e=>{if(e.key==="Escape")close()});
$("prev").onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render()};$("next").onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render()};$("today").onclick=()=>{view=new Date();view.setDate(1);render()};
fetch(location.pathname+"/data").then(r=>r.json()).then(j=>{D=j;if(j.error){document.body.innerHTML="<p style='padding:24px'>"+esc(j.error)+"</p>";return}
document.title=j.client+" campaign calendar";$("t").firstChild.nodeValue=j.client+" campaign calendar";
const e=j.sends.filter(s=>s.channel!=="sms").length,sm=j.sends.filter(s=>s.channel!=="email").length,pr=j.sends.filter(s=>s.type==="promo"&&s.channel!=="sms").length;
$("sub").textContent=e+" emails · "+sm+" SMS · "+pr+" promo emails"+(j.status?" · "+j.status:"");
const now=new Date(),inRange=j.sends.some(s=>s.date.slice(0,7)===todayIso.slice(0,7));view=inRange||!j.sends.length?new Date(now.getFullYear(),now.getMonth(),1):new Date(j.sends[0].date.slice(0,7)+"-01T12:00");
$("extra").innerHTML=j.sections.map(x=>'<div class="card"><h3>'+esc(x.heading)+'</h3>'+x.html+'</div>').join("");render()}).catch(()=>{document.body.innerHTML="<p style='padding:24px'>Couldn't load this calendar.</p>"});
</script></body></html>`;
}

/** Brand book + client library page (data from /b/:token/data). */
export function brandBookPage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Brand book</title>
<style>
:root{--bg:#f5f3ef;--panel:#fff;--ink:#1c1b19;--muted:#6d6a62;--line:#e5e1d8;--soft:#faf8f4}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
.wrap{max-width:1120px;margin:0 auto;padding:28px 16px 80px}
header{margin-bottom:22px}header h1{font-size:30px;line-height:1.15;margin:0 0 6px;text-wrap:balance}.meta{color:var(--muted);font-size:14px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}
.pill{display:inline-block;font-size:12px;font-weight:650;border-radius:999px;padding:2px 10px;background:#efece5;color:#4b483f}.pill.confirmed{background:#e3f3ee;color:#0f4f40}.pill.draft{background:#fdf1d8;color:#7a5410}
nav.tabs{display:flex;gap:6px;margin:0 0 18px;position:sticky;top:0;background:var(--bg);padding:8px 0;z-index:3;overflow-x:auto}
nav.tabs a{flex:none;text-decoration:none;color:var(--muted);font-weight:600;font-size:14px;padding:7px 12px;border-radius:8px}nav.tabs a:hover{color:var(--ink);background:#ebe7df}
section{margin:0 0 34px}section>h2{font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin:0 0 12px}
.swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
.sw{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;cursor:pointer;text-align:left;padding:0;font:inherit;color:inherit;display:flex;flex-direction:column;justify-content:flex-start}.sw:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.sw .chip{height:96px;flex:none;border-bottom:1px solid var(--line)}.sw .t{padding:10px 12px}.sw b{display:block;font-size:14px}.sw code{font:12px/1.4 ui-monospace,Menlo,monospace;color:var(--muted)}.sw p{margin:4px 0 0;font-size:13px;color:var(--muted)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px 20px}
.fonts{display:grid;gap:12px}.font .role{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}.font .sample{font-size:34px;line-height:1.15;margin:6px 0;overflow-wrap:anywhere}.font .fam{font-size:13px;color:var(--muted)}
.btnrow{display:flex;flex-wrap:wrap;gap:16px;align-items:center}.demo{display:inline-block;padding:14px 28px;font-weight:700;font-size:16px;text-decoration:none}
.logos{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.logo{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel)}.logo .img{height:130px;display:flex;align-items:center;justify-content:center;padding:18px}.logo img{max-width:100%;max-height:100%}.logo .t{padding:8px 12px;font-size:13px;border-top:1px solid var(--line)}
.lists{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.lists h3{margin:0 0 6px;font-size:15px}.lists ul{margin:0;padding-left:18px}.lists li{margin:3px 0}.lists .never li::marker{content:"✕  ";color:#c0392b}.lists .yes li::marker{content:"✓  ";color:#1f8a70}
.filters{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}.filters button{font:inherit;font-size:13px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:5px 12px;cursor:pointer;color:inherit}.filters button.on{background:var(--ink);border-color:var(--ink);color:#fff}
.lib{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}
.item{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;cursor:pointer;text-align:left;padding:0;font:inherit;color:inherit;display:flex;flex-direction:column}.item:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.item .th{height:220px;background:var(--soft);display:flex;align-items:flex-start;justify-content:center;overflow:hidden;border-bottom:1px solid var(--line)}.item .th img{width:100%;object-fit:cover;object-position:top}.item .th.doc{align-items:center;font-size:13px;color:var(--muted);padding:16px;text-align:center}
.item .th.copy{align-items:flex-start;justify-content:flex-start;padding:14px;font-size:12.5px;line-height:1.45;color:#4b483f;white-space:pre-line;text-align:left}
.item .t{padding:10px 12px 12px}.item b{display:block;font-size:14px;line-height:1.3}.item small{color:var(--muted);font-size:12px}
.empty{color:var(--muted);font-size:14px}
#scrim{position:fixed;inset:0;background:rgba(20,18,15,.45);opacity:0;pointer-events:none;transition:opacity .15s;z-index:8}#scrim.on{opacity:1;pointer-events:auto}
#drawer{position:fixed;top:0;right:0;bottom:0;width:min(720px,100%);background:var(--panel);transform:translateX(100%);visibility:hidden;transition:transform .2s ease,visibility 0s .2s;overflow-y:auto;z-index:9;padding:20px 22px 40px}#drawer.on{transform:none;visibility:visible;transition:transform .2s ease;box-shadow:-10px 0 40px rgba(0,0,0,.18)}
#drawer .top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}#drawer h3{margin:0;font-size:20px;line-height:1.25}#drawer img{width:100%;border:1px solid var(--line);border-radius:8px;margin-top:14px}
#drawer dl{display:grid;gap:12px;margin:16px 0 0}#drawer dt{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}#drawer dd{margin:2px 0 0;white-space:pre-line}
.x{font:inherit;border:1px solid var(--line);background:#fff;border-radius:8px;padding:6px 12px;cursor:pointer}a.open{display:inline-block;margin-top:14px;background:var(--ink);color:#fff;text-decoration:none;border-radius:8px;padding:9px 14px;font-weight:600}
#toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:8px 14px;border-radius:8px;font-size:14px;opacity:0;transition:opacity .15s;pointer-events:none;z-index:10}#toast.on{opacity:1}
@media (prefers-reduced-motion:reduce){#drawer,#scrim,#toast{transition:none}}
@media (max-width:600px){header h1{font-size:24px}.font .sample{font-size:26px}.item .th{height:180px}.lib{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}
</style></head><body><div class="wrap">
<header><h1 id="t">Loading…</h1><div class="meta" id="meta"></div></header>
<nav class="tabs" id="tabs"></nav>
<main id="main"></main>
</div>
<div id="scrim"></div><aside id="drawer" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="dt"></aside><div id="toast" role="status"></div>
<script>
const $=id=>document.getElementById(id);const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KINDS=[["all","All"],["design","Designs"],["copy","Copy"],["guidelines","Guidelines"],["reference","References"],["logo","Logos"],["product","Product photos"],["photo","Photos"],["other","Other"]];
let D,filter="all";
const file=p=>location.pathname+"/file?p="+encodeURIComponent(p);
const fmt=d=>new Date(d+"T12:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
function casing(t,c){return c==="ALL CAPS"?t.toUpperCase():c==="lowercase"?t.toLowerCase():c==="Sentence case"?t.charAt(0)+t.slice(1).toLowerCase():t}
function lum(h){const [r,g,b]=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);return .2126*r+.7152*g+.0722*b}
function toast(t){$("toast").textContent=t;$("toast").classList.add("on");clearTimeout(toast.k);toast.k=setTimeout(()=>$("toast").classList.remove("on"),1400)}
function loadFonts(b){const g=b.fonts.filter(f=>f.source==="google").map(f=>"family="+encodeURIComponent(f.family)+":wght@400;700");if(g.length){const l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?"+g.join("&")+"&display=swap";document.head.appendChild(l)}
  const css=b.fonts.filter(f=>f.source==="custom").map(f=>{const key=f.family.toLowerCase().replace(/[^a-z0-9]/g,"");const hit=D.fontFiles.find(p=>p.toLowerCase().replace(/[^a-z0-9]/g,"").includes(key));return hit?"@font-face{font-family:'"+f.family.replace(/'/g,"")+"';src:url('"+file(hit)+"')}":""}).join("");if(css){const s=document.createElement("style");s.textContent=css;document.head.appendChild(s)}}
function list(title,xs,cls){return xs&&xs.length?'<div class="card '+(cls||"")+'"><h3>'+title+"</h3><ul>"+xs.map(x=>"<li>"+esc(x)+"</li>").join("")+"</ul></div>":""}
function bookHtml(b){if(!b)return '<section id="brand"><h2>Brand book</h2><p class="empty">No brand book yet. Ask Fluid in this client\\'s channel to build it (from their website and any guidelines you store).</p></section>';
  const fill=b.buttons.fill||(b.colors[0]||{}).hex||"#1c1b19",txt=b.buttons.text||(lum(fill)>.55?"#111111":"#ffffff"),rad=b.buttons.radius_px!==undefined?b.buttons.radius_px+"px":b.buttons.shape==="pill"?"999px":b.buttons.shape==="square"?"0":"8px";
  const head=(b.fonts.find(f=>/head|display|title/i.test(f.role))||b.fonts[0]),body=(b.fonts.find(f=>/body|text|para/i.test(f.role))||b.fonts[b.fonts.length-1]);
  const ff=f=>"'"+f.family.replace(/'/g,"")+"'"+(f.fallback?","+f.fallback:"")+",sans-serif";
  return '<section id="colors"><h2>Colors</h2><div class="swatches">'+b.colors.map(c=>'<button class="sw" data-hex="'+esc(c.hex)+'" aria-label="Copy '+esc(c.name)+' '+esc(c.hex)+'"><div class="chip" style="background:'+esc(c.hex)+'"></div><div class="t"><b>'+esc(c.name)+"</b><code>"+esc(c.hex.toUpperCase())+"</code>"+(c.use?"<p>"+esc(c.use)+"</p>":"")+"</div></button>").join("")+"</div></section>"
  +'<section id="type"><h2>Type</h2><div class="fonts">'+b.fonts.map(f=>'<div class="card font"><div class="role">'+esc(f.role)+'</div><div class="sample" style="font-family:'+esc(ff(f))+'">'+(/body|text/i.test(f.role)?"Clean, considered emails that sound like the brand.":"Made for your morning ritual")+'</div><div class="fam">'+esc(f.family)+(f.source==="custom"?" · custom font":f.source==="google"?" · Google Font":"")+(f.fallback?" · fallback "+esc(f.fallback):"")+(f.notes?" · "+esc(f.notes):"")+"</div></div>").join("")+"</div></section>"
  +'<section id="buttons"><h2>Buttons</h2><div class="card"><div class="btnrow"><span class="demo" style="background:'+esc(fill)+";color:"+esc(txt)+";border-radius:"+rad+";font-family:"+esc(ff(head))+'">'+esc(casing("Shop The Collection",b.buttons.casing))+'</span><span class="fam">CTA casing: <b>'+esc(b.buttons.casing)+"</b> · "+esc(b.buttons.shape)+(b.buttons.notes?" · "+esc(b.buttons.notes):"")+"</span></div></div></section>"
  +(b.logos&&b.logos.length?'<section id="logos"><h2>Logos</h2><div class="logos">'+b.logos.map(l=>{const dark=/light|white|revers|inverse/i.test(l.name+" "+(l.path||"").split("/").pop());return '<div class="logo"><div class="img" style="background:'+(dark?"#1c1b19":"#fff")+'">'+(l.path?'<img src="'+esc(file(l.path))+'" alt="'+esc(l.name)+'" loading="lazy">':"<span>"+esc(l.name)+"</span>")+'</div><div class="t"><b>'+esc(l.name)+"</b>"+(l.use?" · "+esc(l.use):"")+"</div></div>"}).join("")+"</div></section>":"")
  +'<section id="rules"><h2>Rules</h2><div class="lists">'+list("Imagery",b.imagery)+list("Voice",b.voice)+list("Do",b.do,"yes")+list("Don\\'t",b.dont,"never")+list("Claims we can use",b.claims&&b.claims.use,"yes")+list("Never say",b.claims&&b.claims.never,"never")+list("Notes",b.notes)+"</div>"+(b.sources&&b.sources.length?'<p class="empty" style="margin-top:10px">Sources: '+esc(b.sources.join(" · "))+"</p>":"")+"</section>"}
function thumb(i){if(i.url&&/^image\\//.test(i.mime||""))return '<div class="th"><img src="'+esc(i.url)+'" alt="" loading="lazy"></div>';if(i.copy&&!i.url)return '<div class="th copy">'+esc(i.copy.slice(0,260))+"</div>";return '<div class="th doc">'+(i.mime==="application/pdf"?"PDF":i.link?"Link":"File")+(i.email_type?"<br>"+esc(i.email_type):"")+"</div>"}
function libHtml(){const lib=D.library;const have=new Set(lib.map(i=>i.kind));const shown=lib.filter(i=>filter==="all"||i.kind===filter);
  return '<section id="library"><h2>Client library · '+lib.length+'</h2>'+(lib.length?'<div class="filters">'+KINDS.filter(([k])=>k==="all"||have.has(k)).map(([k,l])=>'<button data-f="'+k+'" class="'+(k===filter?"on":"")+'">'+l+"</button>").join("")+'</div><div class="lib">'+shown.map(i=>'<button class="item" data-id="'+i.id+'">'+thumb(i)+'<div class="t"><b>'+esc(i.title)+"</b><small>"+esc([i.email_type,fmt(i.saved)].filter(Boolean).join(" · "))+"</small></div></button>").join("")+"</div>":'<p class="empty">Nothing stored yet. In the client\\'s Slack channel, drop designs, copy or guidelines and say "@Fluid store these".</p>')+"</section>"}
function render(){const b=D.book;$("t").textContent=D.client+" brand book";document.title=D.client+" brand book";
  $("meta").innerHTML=b?'<span class="pill '+b.status+'">'+(b.status==="confirmed"?"Confirmed":"Draft")+"</span><span>Version "+b.version+" · updated "+fmt(b.updated)+"</span>"+(b.note?"<span>Latest change: "+esc(b.note)+"</span>":""):"<span>No brand book yet</span>";
  const tabs=b?[["colors","Colors"],["type","Type"],["buttons","Buttons"]].concat(b.logos&&b.logos.length?[["logos","Logos"]]:[]).concat([["rules","Rules"],["library","Library"]]):[["library","Library"]];
  $("tabs").innerHTML=tabs.map(([id,l])=>'<a href="#'+id+'">'+l+"</a>").join("");
  $("main").innerHTML=bookHtml(b)+libHtml()}
function open(id){const i=D.library.find(x=>x.id===id);if(!i)return;const d=$("drawer");
  d.innerHTML='<div class="top"><div><h3 id="dt">'+esc(i.title)+'</h3><small style="color:var(--muted)">'+esc([i.kind,i.email_type,"saved "+fmt(i.saved)+(i.saved_by?" by "+i.saved_by:"")].filter(Boolean).join(" · "))+'</small></div><button class="x" id="close">Close</button></div>'
  +(i.url&&/^image\\//.test(i.mime||"")?'<img src="'+esc(i.url)+'" alt="'+esc(i.title)+'">':"")
  +"<dl>"+(i.notes?"<div><dt>Notes</dt><dd>"+esc(i.notes)+"</dd></div>":"")+(i.copy?"<div><dt>Copy</dt><dd>"+esc(i.copy)+"</dd></div>":"")+(i.tags&&i.tags.length?"<div><dt>Tags</dt><dd>"+esc(i.tags.join(", "))+"</dd></div>":"")+"</dl>"
  +(i.url&&!/^image\\//.test(i.mime||"")?'<a class="open" href="'+esc(i.url)+'" target="_blank" rel="noopener">Open file</a>':"")+(i.link?'<a class="open" href="'+esc(i.link)+'" target="_blank" rel="noopener">Open link</a>':"");
  d.classList.add("on");d.setAttribute("aria-hidden","false");$("scrim").classList.add("on");$("close").onclick=close;$("close").focus()}
function close(){$("drawer").classList.remove("on");$("drawer").setAttribute("aria-hidden","true");$("scrim").classList.remove("on")}
document.addEventListener("click",e=>{const sw=e.target.closest(".sw");if(sw){navigator.clipboard&&navigator.clipboard.writeText(sw.dataset.hex.toUpperCase()).then(()=>toast("Copied "+sw.dataset.hex.toUpperCase()),()=>{});return}
  const f=e.target.closest("[data-f]");if(f){filter=f.dataset.f;$("main").querySelector("#library").outerHTML=libHtml();return}
  const it=e.target.closest(".item");if(it)open(it.dataset.id)});
$("scrim").onclick=close;document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
fetch(location.pathname+"/data").then(r=>r.json()).then(j=>{D=j;if(D.book)loadFonts(D.book);render()}).catch(()=>{$("t").textContent="This brand book isn't available."});
</script></body></html>`;
}

/** Fluid-team page to connect a client's Shopify store (no onboarding run). */
/** Update a client's stored API keys (Fluid team only). Shows what's connected, never the keys. */
export function keysPage(client: string, st: Record<string, { account: string | null; status: string; updated: string }>) {
  const row = (p: string, label: string) => { const c = st[p]; return `<p class="now">${c ? `${c.status === "connected" ? "✓ Connected" : "⚠ " + esc(c.status)}${c.account ? ` to <b>${esc(c.account)}</b>` : ""}${c.updated ? `, last updated ${esc(c.updated)}` : ""}` : `Not connected`}</p>`; };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Update API keys</title>
<style>${BASE_CSS}section{background:#fff;border:1px solid var(--line);border-radius:14px;padding:28px 32px;margin-bottom:20px}@media (max-width:600px){section{padding:22px 18px}}h2{font-size:22px;margin:0 0 4px}.now{margin:0 0 14px;color:var(--muted);font-size:16px}.q{margin-top:14px}label{display:block;font-weight:650;font-size:17px;margin-bottom:6px}.help{color:var(--muted);font-size:15px;margin:4px 0 0}input{width:100%;font:inherit;font-size:17px;padding:14px;border:1px solid #ccc;border-radius:10px}
button{font:inherit;font-weight:650;font-size:19px;background:var(--accent);color:#fff;border:0;border-radius:10px;padding:18px 24px;min-height:60px;cursor:pointer;width:100%}button:disabled{opacity:.6}#msg{margin-top:14px;font-weight:600}.tag{display:inline-block;background:#1d1d1d;color:#fff;font-size:13px;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:10px}</style></head>
<body><div class="wrap"><span class="tag">Fluid team only</span><h1>Update ${esc(client)}'s API keys</h1><p class="sub">Fill in only the ones you want to change; empty fields keep the current key. Each new key is checked with the platform first, then stored encrypted. Keys are never shown here. This link works once.</p>
<form id="f" autocomplete="off">
<section><h2>Klaviyo</h2>${row("klaviyo", "Klaviyo")}<div class="q"><label for="k">New private API key</label><input id="k" type="password" placeholder="pk_…"><p class="help">Klaviyo → Settings → API keys → Create Private API Key (full access).</p></div></section>
<section><h2>Customer.io</h2>${row("customerio", "Customer.io")}<div class="q"><label for="c">New App API key</label><input id="c" type="password" placeholder="App API key"><p class="help">Customer.io → Settings → API Credentials → App API Keys.</p></div></section>
<section><h2>Shopify</h2>${row("shopify", "Shopify")}<div class="q"><label for="shop">Store address</label><input id="shop" placeholder="brand.myshopify.com"></div><div class="q"><label for="sid">App Client ID</label><input id="sid" placeholder="Leave empty if you paste an Admin API token"></div><div class="q"><label for="ssec">Client secret or Admin API token</label><input id="ssec" type="password" placeholder="shpss_… or shpat_…"></div></section>
<button type="submit" id="go">Update keys</button><div id="msg" role="status"></div></form></div>
<script>
const $=(id)=>document.getElementById(id),f=$("f"),msg=$("msg"),go=$("go");
f.onsubmit=async(e)=>{e.preventDefault();go.disabled=true;msg.textContent="Checking the keys…";
try{const r=await fetch(location.pathname+"/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({klaviyo:$("k").value,customerio:$("c").value,shopify:{shop:$("shop").value,client_id:$("sid").value,secret:$("ssec").value}})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"Something went wrong");
f.innerHTML="<section><h2>Updated</h2><p>"+j.done.map(d=>d.replace(/</g,"&lt;")).join("<br>")+"</p><p class='now'>A note was posted in ${esc(client)}'s Slack channel. This link is now used up.</p></section>"}catch(err){msg.textContent=err.message;go.disabled=false}};
</script></body></html>`;
}

export function shopifyPage(client: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>Connect Shopify</title>
<style>${BASE_CSS}section{background:#fff;border:1px solid var(--line);border-radius:14px;padding:32px 36px;margin-bottom:20px}h2{font-size:24px;margin:0 0 6px}.q{margin-top:22px}label{display:block;font-weight:650;font-size:18px}.help{color:var(--muted);font-size:16px;margin:4px 0 8px}input{width:100%;font:inherit;font-size:18px;border:1px solid #d9d4ca;border-radius:10px;padding:14px 16px;background:#fff;min-height:54px}
button{font:inherit;font-weight:650;font-size:19px;background:var(--accent);color:#fff;border:0;border-radius:10px;padding:18px 24px;min-height:60px;cursor:pointer;width:100%}#msg{margin-top:14px;font-weight:600}.tag{display:inline-block;background:#1d1d1d;color:#fff;border-radius:999px;font-size:13px;padding:3px 10px;margin-bottom:12px}ol{padding-left:22px;margin:8px 0 0}li{margin:4px 0}@media(max-width:600px){section{padding:22px 18px}h1{font-size:28px}}</style></head>
<body><div class="wrap"><span class="tag">Fluid team only</span><h1>Connect ${esc(client)}'s Shopify</h1><p class="sub">Stored encrypted. Fluid reads analytics and orders, and can only ever create new discount codes.</p>
<form id="f"><section><h2>How to get the credentials</h2><ol class="help"><li>The store owner opens the Shopify Dev Dashboard (dev.shopify.com) and creates an app for their store, or uses the one Fluid set up.</li><li>Scopes: read_orders, read_all_orders, read_products, read_customers, read_reports, write_discounts.</li><li>Install it on the store, then copy the Client ID and Client secret from the app's Settings.</li></ol></section>
<section><div class="q" style="margin-top:0"><label for="shop">Store address</label><input id="shop" placeholder="brand.myshopify.com" autocomplete="off" required></div>
<div class="q"><label for="sid">App Client ID</label><input id="sid" autocomplete="off" placeholder="Leave empty if you paste an Admin API token"></div>
<div class="q"><label for="ssec">Client secret or Admin API token</label><input id="ssec" type="password" autocomplete="off" placeholder="shpss_… or shpat_…" required></div></section>
<button type="submit" id="go">Connect Shopify</button><div id="msg" role="status"></div></form></div>
<script>
const f=document.getElementById("f"),msg=document.getElementById("msg"),go=document.getElementById("go");
f.onsubmit=async(e)=>{e.preventDefault();go.disabled=true;msg.textContent="Checking with Shopify…";
try{const r=await fetch(location.pathname+"/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({shopify:{shop:document.getElementById("shop").value,client_id:document.getElementById("sid").value,secret:document.getElementById("ssec").value}})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Something went wrong");
f.innerHTML="<section><h2>Connected</h2><p>"+j.name.replace(/</g,"&lt;")+" is connected. A note was posted in ${esc(client)}'s Slack channel.</p></section>"}catch(err){msg.textContent=err.message;go.disabled=false}};
</script></body></html>`;
}
