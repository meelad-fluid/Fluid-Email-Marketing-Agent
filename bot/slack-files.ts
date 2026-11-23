// Files people drop into Slack (designs, copy docs, brand guides, zips of past emails): downloaded into the
// client's inbox/ (not committed) so the agent can open them and, when asked, store them in the client library.
// Needs the files:read scope. Picks up files from the current message and from earlier messages in the thread,
// so "@Fluid store these" works as a reply under a message full of screenshots.
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { promisify } from "node:util";
import type { WebClient } from "@slack/web-api";
import { config } from "./config";
import { extractOfficeText } from "./onboarding";

const run = promisify(execFile);
const MAX = 30 * 1024 * 1024;
const TYPES = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".pdf", ".docx", ".pptx", ".txt", ".md", ".html", ".csv", ".zip"]);
const INNER = /\.(png|jpe?g|webp|gif|pdf|docx|pptx|txt|md|html)$/i;

export type SlackFile = { id: string; name?: string; title?: string; size?: number; mimetype?: string; url_private_download?: string; url_private?: string; mode?: string };
export type Received = { path: string; name: string; isNew: boolean; inThisMessage: boolean; note?: string };

const safeName = (s: string) => s.replace(/[^A-Za-z0-9._ -]+/g, "").trim().replace(/\s+/g, "-").slice(0, 90) || "file";

/** Download this message's files plus any earlier ones in the thread into <clientDir>/inbox/. */
export async function receiveFiles(web: WebClient, clientDir: string, a: { channel: string; threadTs?: string; ts: string; files?: SlackFile[] }): Promise<Received[]> {
  const current = new Set((a.files ?? []).map((f) => f.id));
  const all = new Map<string, SlackFile>();
  for (const f of a.files ?? []) all.set(f.id, f);
  if (a.threadTs) {
    try {
      const r = await web.conversations.replies({ channel: a.channel, ts: a.threadTs, limit: 200 });
      for (const m of (r.messages ?? []) as any[]) if (!m.bot_id && Array.isArray(m.files)) for (const f of m.files) if (!all.has(f.id)) all.set(f.id, f);
    } catch { /* no thread history: just this message's files */ }
  }
  if (!all.size) return [];
  const inbox = join(clientDir, "inbox"); mkdirSync(inbox, { recursive: true });
  const out: Received[] = [];
  for (const f of [...all.values()].slice(0, 60)) {
    const name = f.name || f.title || f.id, ext = extname(name).toLowerCase(), inThisMessage = current.has(f.id);
    const url = f.url_private_download || f.url_private;
    if (f.mode === "external" || f.mode === "tombstone" || !url) { out.push({ path: "", name, isNew: false, inThisMessage, note: "not downloadable (external or deleted file)" }); continue; }
    if (!TYPES.has(ext)) { out.push({ path: "", name, isNew: false, inThisMessage, note: `skipped: ${ext || "this file type"} isn't supported (images, PDF, Word, PowerPoint, text, HTML or a .zip of those)` }); continue; }
    if ((f.size ?? 0) > MAX) { out.push({ path: "", name, isNew: false, inThisMessage, note: "skipped: over 30 MB" }); continue; }
    const file = join(inbox, `${f.id}-${safeName(name)}`);
    let isNew = false;
    if (!existsSync(file)) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${config.slackBotToken()}` } });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || /text\/html/.test(type) && ext !== ".html") { out.push({ path: "", name, isNew: false, inThisMessage, note: `couldn't download (Slack said ${res.status}; the bot may need the files:read permission)` }); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX) { out.push({ path: "", name, isNew: false, inThisMessage, note: "skipped: over 30 MB" }); continue; }
      writeFileSync(file, buf); isNew = true;
    }
    if (ext === ".zip") {
      const dir = `${file}.d`;
      if (!existsSync(dir)) {
        mkdirSync(dir);
        // Python's zipfile strips absolute paths and ".." from member names. Only supported types, at most 300 files.
        const py = `import sys,zipfile,re,os\nz=zipfile.ZipFile(sys.argv[1]);n=0\nfor m in z.infolist():\n  if m.is_dir() or '__MACOSX' in m.filename or os.path.basename(m.filename).startswith('.') or not re.search(r'${INNER.source}',m.filename,re.I) or m.file_size>${MAX}: continue\n  z.extract(m,sys.argv[2]);n+=1\n  if n>=300: break`;
        try { await run("python3", ["-I", "-c", py, file, dir], { timeout: 120_000 }); } catch { out.push({ path: "", name, isNew, inThisMessage, note: "couldn't open the zip" }); continue; }
      }
      for (const p of walk(dir)) {
        const e = extname(p).toLowerCase();
        if ((e === ".docx" || e === ".pptx") && !existsSync(`${p}.txt`)) await extractOfficeText(p);
        out.push({ path: relative(clientDir, p), name: `${name} → ${relative(dir, p)}`, isNew, inThisMessage });
      }
      continue;
    }
    if ((ext === ".docx" || ext === ".pptx") && !existsSync(`${file}.txt`)) await extractOfficeText(file);
    out.push({ path: relative(clientDir, file), name, isNew, inThisMessage });
  }
  return out;
}

function walk(dir: string, acc: string[] = []) {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) walk(p, acc); else if (INNER.test(d.name) && statSync(p).size) acc.push(p);
  }
  return acc.sort();
}

/** The note the agent gets about the files, appended to the request. */
export function filesNote(files: Received[]) {
  if (!files.length) return "";
  const ok = files.filter((f) => f.path), bad = files.filter((f) => !f.path);
  const lines = ["", "", `Files shared in this Slack thread (saved in this folder; open them with Read. Word/PowerPoint files also have a .txt copy next to them):`];
  for (const f of ok) lines.push(`- ${f.path}${f.inThisMessage ? " (attached to this message)" : " (earlier in the thread)"}${/\.(docx|pptx)$/i.test(f.path) ? ` · text: ${f.path}.txt` : ""}`);
  for (const f of bad) lines.push(`- ${f.name}: ${f.note}`);
  return lines.join("\n");
}
