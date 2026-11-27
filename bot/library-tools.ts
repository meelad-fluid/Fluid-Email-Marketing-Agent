// Library + brand book tools for the Slack agent, bound to ONE client (the id comes from the channel, never the model).
//  - save_to_library / client_library / remove_from_library: the client's own saved work (past designs, copy,
//    references, logos, photos, guidelines) in Supabase, so new work follows the client's direction.
//  - brand_book / save_brand_book: the client's versioned brand book; brand/brand-kit.md is generated from it.
// Every save rebuilds brand/library.md (a short index every job can read) and returns the brand book page link.
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";
import { join, resolve, sep } from "node:path";
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { CLIENTS_DIR } from "./config";
import { db } from "./db";
import { BrandBookSchema, LIBRARY_KINDS, brandKitMarkdown, cacheLibraryFile, currentBrandBook, libraryIndexMarkdown, listLibrary, removeFromLibrary, saveBrandBook, saveToLibrary } from "../lib/library/store";

const ok = (o: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(o) }] });
const BOOK_PATH = "brand/brand-book"; // doc_links path for the brand book page (/b/<token>)

/** The brand book page link for a client (created once, same link forever). */
export async function brandBookLink(clientId: string, clientName: string) {
  const { data: existing } = await db().from("doc_links").select("token").eq("client_id", clientId).eq("path", BOOK_PATH).maybeSingle();
  const token = existing?.token ?? randomBytes(18).toString("base64url");
  if (!existing) await db().from("doc_links").insert({ token, client_id: clientId, path: BOOK_PATH, title: `${clientName} brand book` });
  return `${(process.env.PUBLIC_URL ?? "").replace(/\/+$/, "")}/b/${token}`;
}

/** The "Choose your pop-up style" page link for a client (created once, same link forever). */
export async function popupStyleLink(clientId: string, clientName: string) {
  const path = "popups/style";
  const { data: existing } = await db().from("doc_links").select("token").eq("client_id", clientId).eq("path", path).maybeSingle();
  const token = existing?.token ?? randomBytes(18).toString("base64url");
  if (!existing) await db().from("doc_links").insert({ token, client_id: clientId, path, title: `${clientName} pop-up styles` });
  return `${(process.env.PUBLIC_URL ?? "").replace(/\/+$/, "")}/p/${token}`;
}

export function libraryToolsServer(clientId: string, folder: string, clientName: string, requester?: string) {
  const base = join(CLIENTS_DIR, folder);
  const inFolder = (p: string) => { const f = resolve(base, p.replace(/^\.\//, "")); return f.startsWith(base + sep) && !f.includes(`${sep}.claude${sep}`) ? f : null; };
  const rebuildIndex = async () => {
    const items = await listLibrary(db(), clientId, { limit: 200 });
    mkdirSync(join(base, "brand"), { recursive: true });
    writeFileSync(join(base, "brand", "library.md"), libraryIndexMarkdown(clientName, items));
    return items.length;
  };

  const save = tool(
    "save_to_library",
    `Store things in ${clientName}'s client library (Supabase) so every future email follows the client's direction: past designs and campaigns, current copy, references the team likes, logos, product photos, brand guideline docs. Use it whenever someone says store / save / keep / add this for the client. Open every file first (Read) so the title and notes are accurate. For a design, put every line of its visible copy in copy_text, in order. The same file is never stored twice. Rebuilds brand/library.md and returns the brand book page link (which also shows the library).`,
    {
      items: z.array(z.object({
        path: z.string().optional().describe("file in this folder, e.g. inbox/F0123-welcome-1.png (omit for pasted copy or a link)"),
        kind: z.enum(LIBRARY_KINDS).describe("design = a past email/campaign design; copy = email/SMS copy; reference = something to learn from (theirs or a link); logo; product = product photo; photo = lifestyle/other photo; guidelines = brand guide / style doc"),
        title: z.string().min(2).describe("short name, e.g. 'BFCM 2025 — 40% off hero email'"),
        notes: z.string().optional().describe("what it is and what to take from it: layout, offer, tone, what the client liked or disliked"),
        copy_text: z.string().optional().describe("all the copy, in order (subject/preview if known, then each section)"),
        email_type: z.string().optional().describe("e.g. 'Welcome #2', 'sale', 'recipe', 'launch'"),
        tags: z.array(z.string()).optional().describe("e.g. ['bfcm', 'approved', 'top performer', 'dark']"),
        source_url: z.string().url().optional().describe("for a link (Figma frame, live email, web page)"),
      })).min(1).max(60),
    },
    async ({ items }) => {
      try {
        const bad = items.filter((i) => i.path && !inFolder(i.path)).map((i) => i.path);
        if (bad.length) return ok({ error: `These aren't files in this client's folder: ${bad.join(", ")}` });
        const res = await saveToLibrary(db(), clientId, items.map((i) => ({ ...i, file: i.path ? inFolder(i.path)! : undefined })), requester);
        // Logos and photos also go into brand/assets/library/ (committed, max 2400px) so designs can use them as asset:<path>.
        const assets: { title: string; asset: string }[] = [];
        for (const [k, i] of items.entries()) {
          if (!i.path || !res[k]?.id || !["logo", "product", "photo"].includes(i.kind) || !/\.(png|jpe?g|webp)$/i.test(i.path)) continue;
          const slug = i.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || res[k].id!.slice(0, 8);
          const png = i.kind === "logo" || /\.png$/i.test(i.path);
          const rel = `brand/assets/library/${slug}.${png ? "png" : "jpg"}`;
          mkdirSync(join(base, "brand", "assets", "library"), { recursive: true });
          const img = sharp(inFolder(i.path)!).resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true });
          await (png ? img.png() : img.jpeg({ quality: 90 })).toFile(join(base, rel)).then(() => assets.push({ title: i.title, asset: rel }), () => {});
        }
        const total = await rebuildIndex();
        return ok({ saved: res.filter((r) => r.id && !r.duplicate).length, already_stored: res.filter((r) => r.duplicate).map((r) => r.title), failed: res.filter((r) => r.error), brand_assets: assets, library_total: total, page: await brandBookLink(clientId, clientName),
          next: "If these show how the client wants emails to look or sound, update brand/direction.md (a short running summary of their overall direction: layouts, type, imagery, tone, offers, what they approve or push back on). If they include brand rules (colors, fonts, buttons, logo use), update the brand book with save_brand_book." });
      } catch (e: any) { return ok({ error: e.message }); }
    },
  );

  const list = tool(
    "client_library",
    `Look through ${clientName}'s client library: their past designs, copy, references, logos, photos and guidelines. Returns each item's notes and copy, and downloads files into library/ so you can open them with Read. Use it before designing (past designs of the same type), writing copy (their voice and offers) or planning (what they've run).`,
    {
      kind: z.enum(LIBRARY_KINDS).optional(),
      tag: z.string().optional(),
      search: z.string().optional().describe("matches title, notes, email type and copy"),
      limit: z.number().int().min(1).max(60).optional().describe("default 12"),
    },
    async ({ kind, tag, search, limit }) => {
      try {
        const items = await listLibrary(db(), clientId, { kind, tag, search, limit: limit ?? 12 });
        const out = [];
        let opened = 0;
        for (const i of items) {
          const local = i.storage_path && opened < 16 ? await cacheLibraryFile(db(), i, base) : null;
          if (local) opened++;
          out.push({ id: i.id.slice(0, 8), kind: i.kind, title: i.title, email_type: i.email_type, notes: i.notes, tags: i.tags, saved: i.created_at.slice(0, 10), file: local ? local.slice(base.length + 1) : null, link: i.source_url, copy: i.copy_text ? i.copy_text.slice(0, 2500) : null });
        }
        return ok({ items: out, note: out.length ? "Open the files with Read." : "Nothing in the library matches. Brand/library.md lists everything stored." });
      } catch (e: any) { return ok({ error: e.message }); }
    },
  );

  const remove = tool(
    "remove_from_library",
    "Remove one item from the client library (only when someone asks). Pass the 8-character id from client_library or brand/library.md.",
    { id: z.string().min(8) },
    async ({ id }) => {
      try {
        const all = await listLibrary(db(), clientId, { limit: 200 });
        const hit = all.find((i) => i.id.startsWith(id.toLowerCase()));
        if (!hit) return ok({ error: "No library item with that id." });
        const title = await removeFromLibrary(db(), clientId, hit.id);
        await rebuildIndex();
        return ok({ removed: title });
      } catch (e: any) { return ok({ error: e.message }); }
    },
  );

  const book = tool(
    "brand_book",
    `${clientName}'s current brand book (colors, fonts, buttons + CTA casing, logos, imagery, voice, do/don't, claims), its version and status, and the link to its page. brand/brand-kit.md is generated from it.`,
    {},
    async () => {
      try {
        const cur = await currentBrandBook(db(), clientId);
        const link = await brandBookLink(clientId, clientName);
        if (!cur) return ok({ none: true, link, next: existsSync(join(base, "brand", "brand-kit.md")) ? "No brand book saved yet. Build one from brand/brand-kit.md (keep every detail: colors, fonts, CTA casing, logos, imagery, trust points, never-say lines) plus anything in the library's guidelines, and call save_brand_book." : "No brand book yet. Build one from the website (and any guidelines in the library) and call save_brand_book." });
        return ok({ version: cur.version, status: cur.status, updated: cur.created_at.slice(0, 10), book: cur.kit, link });
      } catch (e: any) { return ok({ error: e.message }); }
    },
  );

  const saveBook = tool(
    "save_brand_book",
    `Save a new version of ${clientName}'s brand book (the whole book, not a diff: start from brand_book and change only what's new). Rewrites brand/brand-kit.md from it. Use it for every brand change (new colors, fonts, button style, logo, rules from their guide or the team's feedback) and never edit brand/brand-kit.md directly. Status 'confirmed' only when the client or Fluid's team has confirmed it.`,
    {
      book: BrandBookSchema,
      note: z.string().min(3).describe("what changed and why, e.g. 'Added accent green from their 2026 brand guide'"),
      status: z.enum(["draft", "confirmed"]).optional(),
    },
    async ({ book, note, status }) => {
      try {
        const version = await saveBrandBook(db(), clientId, book, { note, status, savedBy: requester });
        const cur = await currentBrandBook(db(), clientId);
        mkdirSync(join(base, "brand"), { recursive: true });
        writeFileSync(join(base, "brand", "brand-kit.md"), brandKitMarkdown(clientName, book, { version, status: cur?.status ?? "draft", updated: new Date().toISOString().slice(0, 10) }));
        return ok({ saved: true, version, status: cur?.status, link: await brandBookLink(clientId, clientName) });
      } catch (e: any) { return ok({ error: e.message }); }
    },
  );

  return createSdkMcpServer({ name: "fluid_library", version: "1.0.0", tools: [save, list, remove, book, saveBook] });
}

export const LIBRARY_TOOLS = ["mcp__fluid_library__save_to_library", "mcp__fluid_library__client_library", "mcp__fluid_library__remove_from_library", "mcp__fluid_library__brand_book", "mcp__fluid_library__save_brand_book"];
