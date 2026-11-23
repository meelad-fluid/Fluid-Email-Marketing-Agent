// One client's library (past designs, copy, references, logos, photos, guidelines) and brand book, in Supabase.
// Library files go to the private 'client-assets' bucket under <client_id>/library/; rows in client_library.
// The brand book is a versioned JSON in brand_kits; brand/brand-kit.md in the client folder is generated from it
// (the designer and copywriter read that file), so the two never drift apart.
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { z } from "zod";

const BUCKET = "client-assets";
export const LIBRARY_KINDS = ["design", "copy", "reference", "logo", "product", "photo", "guidelines", "other"] as const;
export type LibraryKind = (typeof LIBRARY_KINDS)[number];
const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".md": "text/markdown", ".txt": "text/plain", ".html": "text/html", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
const IMAGE = /\.(png|jpe?g|webp|gif)$/i;

export type LibraryItem = { id: string; kind: LibraryKind; title: string; notes: string | null; copy_text: string | null; email_type: string | null; tags: string[]; storage_path: string | null; file_name: string | null; mime: string | null; width: number | null; height: number | null; source_url: string | null; saved_by: string | null; created_at: string };
const COLS = "id, kind, title, notes, copy_text, email_type, tags, storage_path, file_name, mime, width, height, source_url, saved_by, created_at";

export type NewItem = { file?: string; kind: LibraryKind; title: string; notes?: string; copy_text?: string; email_type?: string; tags?: string[]; source_url?: string };

/** Save items to the library. `file` is an absolute path (already checked to be inside the client folder). Same file twice = kept once. */
export async function saveToLibrary(db: SupabaseClient, clientId: string, items: NewItem[], savedBy?: string) {
  const out: { title: string; id?: string; duplicate?: boolean; error?: string }[] = [];
  for (const it of items) {
    try {
      if (!it.file && !it.copy_text && !it.source_url) throw new Error("needs a file, copy_text or source_url");
      let buf: Buffer | null = null, ext = "", width: number | null = null, height: number | null = null;
      if (it.file) {
        if (!existsSync(it.file)) throw new Error("file not found");
        buf = readFileSync(it.file); ext = extname(it.file).toLowerCase();
        if (buf.length > 30 * 1024 * 1024) throw new Error("over 30 MB");
        if (IMAGE.test(ext)) { const m = await sharp(buf).metadata().catch(() => null); width = m?.width ?? null; height = m?.height ?? null; }
      }
      const hash = createHash("sha256").update(buf ?? `${it.kind}|${it.title}|${it.copy_text ?? ""}|${it.source_url ?? ""}`).digest("hex");
      const { data: dup } = await db.from("client_library").select("id").eq("client_id", clientId).eq("file_hash", hash).maybeSingle();
      if (dup) { out.push({ title: it.title, id: dup.id, duplicate: true }); continue; }
      const id = randomUUID();
      let storage_path: string | null = null;
      if (buf) {
        storage_path = `${clientId}/library/${id}${ext}`;
        const up = await db.storage.from(BUCKET).upload(storage_path, buf, { contentType: MIME[ext] ?? "application/octet-stream", upsert: false });
        if (up.error) throw new Error(`upload failed: ${up.error.message}`);
      }
      const tags = [...new Set((it.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean))];
      const ins = await db.from("client_library").insert({ id, client_id: clientId, kind: it.kind, title: it.title.slice(0, 200), notes: it.notes ?? null, copy_text: it.copy_text ?? null, email_type: it.email_type ?? null, tags, storage_path, file_name: it.file ? basename(it.file).replace(/^F[A-Z0-9]{8,}-/, "") : null, mime: MIME[ext] ?? null, width, height, bytes: buf?.length ?? null, source_url: it.source_url ?? null, file_hash: hash, saved_by: savedBy ?? null });
      if (ins.error) { if (storage_path) await db.storage.from(BUCKET).remove([storage_path]); throw new Error(ins.error.message); }
      out.push({ title: it.title, id });
    } catch (e: any) { out.push({ title: it.title, error: e.message }); }
  }
  return out;
}

export async function listLibrary(db: SupabaseClient, clientId: string, f: { kind?: LibraryKind; tag?: string; search?: string; limit?: number } = {}): Promise<LibraryItem[]> {
  let q = db.from("client_library").select(COLS).eq("client_id", clientId).order("created_at", { ascending: false }).limit(Math.min(f.limit ?? 40, 200));
  if (f.kind) q = q.eq("kind", f.kind);
  if (f.tag) q = q.contains("tags", [f.tag.toLowerCase()]);
  if (f.search) { const s = f.search.replace(/[%,()]/g, " ").trim(); q = q.or(`title.ilike.%${s}%,notes.ilike.%${s}%,email_type.ilike.%${s}%,copy_text.ilike.%${s}%`); }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as LibraryItem[];
}

/** Download a library file into the client's local cache (library/, not committed) so the agent can open it. */
export async function cacheLibraryFile(db: SupabaseClient, item: LibraryItem, clientDir: string): Promise<string | null> {
  if (!item.storage_path) return null;
  const dir = join(clientDir, "library"); mkdirSync(dir, { recursive: true });
  const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item";
  const local = join(dir, `${item.id.slice(0, 8)}-${slug}${extname(item.storage_path)}`);
  if (existsSync(local)) return local;
  const { data, error } = await db.storage.from(BUCKET).download(item.storage_path);
  if (error || !data) return null;
  writeFileSync(local, Buffer.from(await data.arrayBuffer()));
  return local;
}

export async function signedUrl(db: SupabaseClient, path: string, seconds = 3600) {
  const { data } = await db.storage.from(BUCKET).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}

export async function removeFromLibrary(db: SupabaseClient, clientId: string, id: string) {
  const { data } = await db.from("client_library").select("id, title, storage_path").eq("client_id", clientId).eq("id", id).maybeSingle();
  if (!data) return null;
  if (data.storage_path) await db.storage.from(BUCKET).remove([data.storage_path]);
  await db.from("client_library").delete().eq("id", id).eq("client_id", clientId);
  return data.title as string;
}

/** brand/library.md: a short index of what's stored, so every job sees the client's library without a tool call. */
export function libraryIndexMarkdown(clientName: string, items: LibraryItem[]) {
  const groups: [LibraryKind, string][] = [["design", "Past designs"], ["copy", "Copy"], ["guidelines", "Brand guidelines"], ["reference", "References"], ["logo", "Logos"], ["product", "Product photos"], ["photo", "Photos"], ["other", "Other"]];
  const lines = [`# ${clientName}: client library`, "", "Everything the team saved for this client. Open any item with client_library (it downloads the file into library/ and returns its copy). Don't edit this file: it's rebuilt on every save.", ""];
  for (const [k, label] of groups) {
    const g = items.filter((i) => i.kind === k);
    if (!g.length) continue;
    lines.push(`## ${label} (${g.length})`, "");
    for (const i of g) {
      const bits = [i.email_type, i.created_at.slice(0, 10), i.saved_by ? `saved by ${i.saved_by}` : ""].filter(Boolean).join(" · ");
      lines.push(`- **${i.title}** (${bits})${i.notes ? `: ${i.notes.replace(/\s+/g, " ").slice(0, 220)}` : ""}${i.tags.length ? ` [${i.tags.join(", ")}]` : ""}${i.source_url ? ` [link](${i.source_url})` : ""} · id ${i.id.slice(0, 8)}`);
    }
    lines.push("");
  }
  if (lines.length === 4) lines.push("Nothing saved yet.");
  return lines.join("\n");
}

// ── Brand book ──
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "colors are 6-digit hex like #E03400");
export const BrandBookSchema = z.object({
  colors: z.array(z.object({ name: z.string().min(1), hex, use: z.string().default("") })).min(1),
  fonts: z.array(z.object({ role: z.string().min(1).describe("headings | body | accent | numbers…"), family: z.string().min(1), fallback: z.string().default(""), source: z.enum(["google", "custom", "system"]).default("google"), notes: z.string().default("") })).min(1),
  buttons: z.object({ casing: z.enum(["Title Case", "ALL CAPS", "Sentence case", "lowercase"]), shape: z.enum(["pill", "rounded", "square"]).default("rounded"), radius_px: z.number().min(0).max(999).optional(), fill: hex.optional(), text: hex.optional(), notes: z.string().default("") }),
  logos: z.array(z.object({ name: z.string(), path: z.string().default("").describe("brand/assets/... in the client folder"), use: z.string().default("") })).default([]),
  imagery: z.array(z.string()).default([]),
  voice: z.array(z.string()).default([]),
  do: z.array(z.string()).default([]),
  dont: z.array(z.string()).default([]),
  claims: z.object({ use: z.array(z.string()).default([]), never: z.array(z.string()).default([]) }).default({ use: [], never: [] }),
  notes: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]).describe("where this came from: website, the client's brand guide PDF, team feedback"),
});
export type BrandBook = z.infer<typeof BrandBookSchema>;
export type BrandBookRow = { version: number; status: "draft" | "confirmed"; kit: BrandBook; note: string | null; saved_by: string | null; created_at: string };

export async function currentBrandBook(db: SupabaseClient, clientId: string): Promise<BrandBookRow | null> {
  const { data } = await db.from("brand_kits").select("version, status, kit, note, saved_by, created_at").eq("client_id", clientId).order("version", { ascending: false }).limit(1).maybeSingle();
  return (data as BrandBookRow) ?? null;
}

export async function saveBrandBook(db: SupabaseClient, clientId: string, book: BrandBook, o: { status?: "draft" | "confirmed"; note?: string; savedBy?: string } = {}) {
  const cur = await currentBrandBook(db, clientId);
  const version = (cur?.version ?? 0) + 1;
  const { error } = await db.from("brand_kits").insert({ client_id: clientId, version, kit: book, status: o.status ?? cur?.status ?? "draft", note: o.note ?? null, saved_by: o.savedBy ?? null });
  if (error) throw new Error(error.message);
  return version;
}

/** brand/brand-kit.md, generated from the brand book (what the designer, copywriter and QC read). */
export function brandKitMarkdown(clientName: string, b: BrandBook, v: { version: number; status: string; updated: string }) {
  const list = (xs: string[]) => xs.map((x) => `  - ${x}`).join("\n");
  const L = [
    `# ${clientName}: brand book (v${v.version}, ${v.status}, updated ${v.updated})`,
    "",
    "> Generated from the brand book in Fluid's backend. Change it with save_brand_book, never by editing this file.",
    "",
    "- **Colors:**",
    ...b.colors.map((c) => `  - ${c.name} ${c.hex.toUpperCase()}${c.use ? `: ${c.use}` : ""}`),
    "- **Fonts:**",
    ...b.fonts.map((f) => `  - ${f.role}: ${f.family}${f.source === "custom" ? " (custom font)" : f.source === "google" ? " (Google Font)" : ""}${f.fallback ? `, fallback ${f.fallback}` : ""}${f.notes ? `. ${f.notes}` : ""}`),
    `- **Buttons:** ${b.buttons.shape}${b.buttons.radius_px !== undefined ? `, ${b.buttons.radius_px}px radius` : ""}${b.buttons.fill ? `, fill ${b.buttons.fill.toUpperCase()}` : ""}${b.buttons.text ? `, text ${b.buttons.text.toUpperCase()}` : ""}. **CTA casing: ${b.buttons.casing}**${b.buttons.notes ? `. ${b.buttons.notes}` : ""}`,
  ];
  if (b.logos.length) L.push("- **Logos:**", ...b.logos.map((l) => `  - ${l.name}${l.path ? ` (${l.path})` : ""}${l.use ? `: ${l.use}` : ""}`));
  if (b.imagery.length) L.push("- **Imagery:**", list(b.imagery));
  if (b.voice.length) L.push("- **Voice:**", list(b.voice));
  if (b.do.length) L.push("- **Do:**", list(b.do));
  if (b.dont.length) L.push("- **Don't:**", list(b.dont));
  if (b.claims.use.length) L.push("- **Claims we can use:**", list(b.claims.use));
  if (b.claims.never.length) L.push("- **Never say:**", list(b.claims.never));
  if (b.notes.length) L.push("- **Notes:**", list(b.notes));
  if (b.sources.length) L.push(`- **Sources:** ${b.sources.join(" · ")}`);
  return L.join("\n") + "\n";
}

// ── On-brand color check (used by render_preview) ──
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function lab([r, g, b]: number[]) {
  const f = (c: number) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
  const [R, G, B] = [f(r), f(g), f(b)];
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, y = R * 0.2126 + G * 0.7152 + B * 0.0722, z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const t = (v: number) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  return [116 * t(y) - 16, 500 * (t(x) - t(y)), 200 * (t(y) - t(z))];
}
const dE = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const hueGap = (a: number[], b: number[]) => { const d = Math.abs(Math.atan2(a[2], a[1]) - Math.atan2(b[2], b[1])) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
/** Colors used in a design that are clearly not in the brand palette. Neutrals (white, black, greys) always pass; tints of brand colors pass. */
export function offBrandColors(used: { hex: string; where: string }[], palette: string[]) {
  const pal = palette.map((h) => lab(rgb(h)));
  const out = new Map<string, string[]>();
  for (const u of used) {
    const c = rgb(u.hex), L = lab(c), chroma = Math.hypot(L[1], L[2]);
    if (chroma < 12) continue; // neutral
    const near = pal.some((p) => dE(L, p) < 18 || (hueGap(L, p) < 0.25 && Math.hypot(p[1], p[2]) > 12)); // same color, or a tint/shade of it
    if (!near) out.set(u.hex, [...(out.get(u.hex) ?? []), u.where].slice(0, 3));
  }
  return [...out.entries()].map(([hex, where]) => ({ hex, where }));
}
