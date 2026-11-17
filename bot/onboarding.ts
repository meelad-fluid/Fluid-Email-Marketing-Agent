// New-client onboarding, end to end from Slack:
//   /fluid onboard Brand Name | brand.com
//     → client row in Supabase, client folder (from clients/_template, with the isolation guard), saved to GitHub
//     → private Slack channel #client-<slug> with the Fluid team, locked to this client
//     → onboarding link for the client (form served by this server; Klaviyo key stored in the vault)
//   form submitted → runOnboarding(): Klaviyo audit + order data, sync, then the agent runs the
//     fluid-client-onboarding skill (research, Onboarding Doc, month-1 plan, flow plan, brand kit) and posts doc links.
import { createHash, randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import type { WebClient } from "@slack/web-api";
import { CLIENTS_DIR, ROOT } from "./config";
import { db, linkChannel } from "./db";
import { saveClientFolder } from "./git";
import { publicUrl } from "./review";
import { SECTIONS } from "../lib/onboarding/questions";

const run = promisify(execFile);
export const TEAM = () => (process.env.SLACK_TEAM_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
export const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

function makeFolder(slug: string, name: string) {
  const dir = join(CLIENTS_DIR, slug);
  if (!existsSync(dir)) {
    cpSync(join(CLIENTS_DIR, "_template"), dir, { recursive: true });
    for (const f of ["README.md", "memory.md"]) if (existsSync(join(dir, f))) writeFileSync(join(dir, f), readFileSync(join(dir, f), "utf8").replace(/<Client>/g, name));
  }
  mkdirSync(join(dir, ".claude"), { recursive: true });
  writeFileSync(join(dir, ".claude/settings.json"), JSON.stringify({ hooks: { PreToolUse: [{ matcher: "Read|Edit|Write|MultiEdit|NotebookEdit|Glob|Grep|Bash", hooks: [{ type: "command", command: `python3 "$CLAUDE_PROJECT_DIR/../_guard.py" ${slug}` }] }] } }, null, 2) + "\n");
  writeFileSync(join(dir, "CLAUDE.md"), `# ${name} — client workspace\n\nThis session works for **${name} only**.\n\n- Read \`memory.md\` before anything else; append to it (dated) before finishing any task.\n- Everything you make goes in this folder (copy/, designs/, strategy/, research/, brand/).\n- Other clients' folders are blocked by a hook. Never bring another brand's copy, claims, product names, images, results or data into ${name}'s work.\n- Fluid's shared brain is available: ../../brain/ (skills, flow system), ../../knowledge/ (SOPs). The reference library may be used for layout and structure only.\n- Reporting and data: only ${name}'s Klaviyo / Shopify account, resolved by its own id.\n`);
  for (const d of ["copy", "designs", "strategy", "research", "brand/assets", "onboarding"]) mkdirSync(join(dir, d), { recursive: true });
  return dir;
}

export async function startNewClient(web: WebClient, o: { name: string; website: string; requestedBy: string; teamId: string; internal?: boolean }) {
  const name = o.name.trim();
  const website = /^https?:\/\//.test(o.website.trim()) ? o.website.trim() : `https://${o.website.trim()}`;
  new URL(website); // throws on a bad URL
  // Reuse an existing folder for this brand (matched by website domain), else make one from the name.
  const domain = new URL(website).hostname.replace(/^www\./, "").toLowerCase();
  const existingFolder = readdirSync(CLIENTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .find((d) => ["README.md", "memory.md", "brand/brand-kit.md"].some((f) => existsSync(join(CLIENTS_DIR, d.name, f)) && readFileSync(join(CLIENTS_DIR, d.name, f), "utf8").toLowerCase().includes(domain)))?.name;
  const slug = existingFolder ?? slugify(name);
  if (!slug) throw new Error("That brand name doesn't make a usable folder name.");

  // A client already in the database is resumed if an earlier attempt stopped before its channel was made.
  let { data: client } = await db().from("clients").select("id, folder").or(`folder.eq.${slug},slug.eq.${slug}`).maybeSingle();
  if (client) {
    const { data: ch } = await db().from("slack_channels").select("channel_id").eq("client_id", client.id).limit(1).maybeSingle();
    if (ch && !o.internal) throw new Error(`${name} is already set up in <#${ch.channel_id}>.`);
    if (ch) {
      const url = await internalLink(client.id);
      await web.chat.postMessage({ channel: ch.channel_id, text: INTERNAL_MSG(name, url) });
      return { slug: client.folder as string, channelId: ch.channel_id as string, url, clientId: client.id as string };
    }
  } else {
    const ins = await db().from("clients").insert({ name, slug, folder: slug, website_url: website, status: "onboarding" }).select("id, folder").single();
    if (ins.error) throw ins.error;
    client = ins.data;
  }
  makeFolder(slug, name);
  if (!existsSync(join(CLIENTS_DIR, slug, "onboarding", "README.md"))) writeFileSync(join(CLIENTS_DIR, slug, "onboarding", "README.md"), `# Onboarding\nWebsite: ${website}\nStarted from Slack by <@${o.requestedBy}> on ${new Date().toISOString().slice(0, 10)}.\n`);
  await saveClientFolder(slug, `${slug}: ${existingFolder ? "connected existing client" : "new client"} ${name} (via Slack)`);

  // Private channel, Fluid team only, locked to this client.
  let channelId: string;
  const base = `client-${slug}`.slice(0, 70);
  try {
    channelId = (await web.conversations.create({ name: base, is_private: true })).channel!.id!;
  } catch (e: any) {
    if (e.data?.error !== "name_taken") throw new Error(`Couldn't create the channel (${e.data?.error ?? e.message}). The Slack app needs the groups:write scope.`);
    channelId = (await web.conversations.create({ name: `${base}-${randomBytes(2).toString("hex")}`, is_private: true })).channel!.id!;
  }
  const people = [...new Set([...TEAM(), o.requestedBy])];
  await web.conversations.invite({ channel: channelId, users: people.join(",") }).catch((e: any) => console.error("[onboard] invite:", e.data?.error ?? e.message));
  await linkChannel(channelId, o.teamId, slug, name, o.requestedBy);

  const token = randomBytes(24).toString("base64url");
  const { data: link } = await db().from("onboarding_links").insert({ client_id: client.id, token_hash: hashToken(token), ...(o.internal ? { kind: "internal", expires_at: new Date(Date.now() + 14 * 86400_000).toISOString() } : {}) }).select("id").single();
  await db().from("onboarding_runs").insert({ client_id: client.id, link_id: link?.id ?? null, started_by: o.requestedBy });
  const url = `${publicUrl()}/onboard/${token}`;
  if (o.internal) {
    await web.chat.postMessage({ channel: channelId, text: INTERNAL_MSG(name, url) });
    return { slug, channelId, url, clientId: client.id };
  }
  const onb = join(CLIENTS_DIR, slug, "onboarding");
  const hasForm = existsSync(onb) && readdirSync(onb).some((f) => /form/i.test(f) && !/form-answers/.test(f));
  await web.chat.postMessage({ channel: channelId, text: hasForm
    ? `*${name}* is set up (${website}). Their onboarding form is already in the folder, so they don't need to fill it in again.\nSend them this link only to connect Klaviyo: ${url}\nOr say \`@fluid run the onboarding\` to start now from the form and the website, and I'll add the Klaviyo audit once they connect.`
    : `New client: *${name}* (${website}).\nSend this onboarding link to the client: ${url}\nOnce they submit it I'll run the Klaviyo audit and research, then post the Onboarding Doc and the first month's plan here.` });
  return { slug, channelId, url, clientId: client.id };
}

/** True when the client's form is already in the folder (filled outside the app), so the link only needs the Klaviyo key. */
export function hasExistingForm(folder: string) {
  const onb = join(CLIENTS_DIR, folder, "onboarding");
  return existsSync(onb) && readdirSync(onb).some((f) => /form/i.test(f) && !/^form-answers\.md$/.test(f));
}

const INTERNAL_MSG = (name: string, url: string) => `*${name}* internal setup link (Fluid team only, don't send it to the client): ${url}\nUpload their brand guidelines and paste the Klaviyo key, and I'll run the onboarding here. The link works once and expires in 14 days.`;

/** A one-use link for the Fluid team: brand guidelines upload + Klaviyo key, for clients we already work with. */
export async function internalLink(clientId: string) {
  const token = randomBytes(24).toString("base64url");
  await db().from("onboarding_links").insert({ client_id: clientId, token_hash: hashToken(token), kind: "internal", expires_at: new Date(Date.now() + 14 * 86400_000).toISOString() });
  return `${publicUrl()}/onboard/${token}`;
}

/** A fresh one-use link for this client (e.g. to connect Klaviyo after someone pasted a key in Slack). */
export async function newConnectLink(clientId: string) {
  const token = randomBytes(24).toString("base64url");
  await db().from("onboarding_links").insert({ client_id: clientId, token_hash: hashToken(token) });
  return `${publicUrl()}/onboard/${token}`;
}

/** Questions shown on the client form (files are replaced by a shared-folder link; Shopify is connected later). */
export const formSections = () => SECTIONS.map((s) => ({ ...s, questions: s.questions.filter((q) => q.type !== "files" && !(q.type === "connection" && q.provider === "shopify")) })).filter((s) => s.questions.length);

export async function formLink(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const { data } = await db().from("onboarding_links").select("id, client_id, kind, expires_at, revoked_at, clients(name, folder, website_url)").eq("token_hash", hashToken(token)).maybeSingle();
  if (!data || data.revoked_at || Date.parse(data.expires_at) < Date.now()) return null;
  return data as any as { id: string; client_id: string; kind: "client" | "internal"; clients: { name: string; folder: string; website_url: string } };
}

async function storeKlaviyoKey(clientId: string, klaviyoKey?: string) {
  if (!klaviyoKey?.trim()) return "not provided";
  const key = klaviyoKey.trim();
  const r = await fetch("https://a.klaviyo.com/api/accounts/", { headers: { Authorization: `Klaviyo-API-Key ${key}`, revision: "2025-10-15", accept: "application/vnd.api+json" } });
  if (!r.ok) throw new Error("That Klaviyo key didn't work. It should be a Private API key that starts with pk_.");
  const acct: any = await r.json();
  const org = acct.data?.[0]?.attributes?.contact_information?.organization_name ?? null;
  const { error } = await db().rpc("store_connection_secret", { p_client: clientId, p_provider: "klaviyo", p_secret: key, p_meta: {}, p_account_name: org });
  if (error) throw new Error("Couldn't store the Klaviyo key securely.");
  return `connected (${org ?? "account"})`;
}

// ── Internal setup (current clients): brand guidelines upload + Klaviyo key ──
const UPLOAD_TYPES = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".docx", ".pptx", ".txt", ".md"]);
export const MAX_UPLOAD = 30 * 1024 * 1024;

/** Save one brand-guidelines file into brand/guidelines/ (Word/PowerPoint also get a .txt copy the agent can read). */
export async function saveUpload(token: string, filename: string, data: Buffer) {
  const l = await formLink(token);
  if (!l || l.kind !== "internal") throw new Error("This link has expired or was already used.");
  const ext = extname(filename).toLowerCase();
  if (!UPLOAD_TYPES.has(ext)) throw new Error(`${filename}: use PDF, images, Word, PowerPoint or text files.`);
  if (!data.length || data.length > MAX_UPLOAD) throw new Error(`${filename} is too big (30 MB max per file).`);
  const safe = basename(filename, ext).replace(/[^A-Za-z0-9._ -]+/g, "").trim().replace(/\s+/g, "-").slice(0, 80) || "guidelines";
  const dir = join(CLIENTS_DIR, l.clients.folder, "brand", "guidelines");
  mkdirSync(dir, { recursive: true });
  let name = `${safe}${ext}`;
  for (let i = 2; existsSync(join(dir, name)); i++) name = `${safe}-${i}${ext}`;
  writeFileSync(join(dir, name), data);
  if (ext === ".docx" || ext === ".pptx") {
    const py = `import sys,zipfile,re\nz=zipfile.ZipFile(sys.argv[1]);out=[]\nnames=sorted([n for n in z.namelist() if n=="word/document.xml" or re.match(r"ppt/slides/slide\\d+\\.xml$",n)],key=lambda n:int(re.sub(r"\\D","",n) or 0))\nfor n in names:\n  x=z.read(n).decode("utf8","ignore");x=re.sub(r"</(w|a):p>","\\n",x);out.append(re.sub(r"<[^>]+>","",x))\nprint("\\n\\n".join(out))`;
    try { const { stdout } = await run("python3", ["-I", "-c", py, join(dir, name)], { maxBuffer: 20 * 1024 * 1024, timeout: 60_000 }); writeFileSync(join(dir, `${name}.txt`), stdout); } catch { /* the original file is still there */ }
  }
  return name;
}

/** Save the internal setup form: key → vault, notes → onboarding/internal-setup.md, link used up. */
export async function saveInternalForm(token: string, answers: Record<string, unknown>, klaviyoKey?: string) {
  const l = await formLink(token);
  if (!l || l.kind !== "internal") throw new Error("This link has expired or was already used.");
  const dir = join(CLIENTS_DIR, l.clients.folder, "brand", "guidelines");
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => !f.endsWith(".txt") || !existsSync(join(dir, f.slice(0, -4)))) : [];
  const link = String(answers.guidelines_url ?? "").trim().slice(0, 500);
  if (!files.length && !link) throw new Error("Add the brand guidelines (a file or a link) first.");
  const klaviyo = await storeKlaviyoKey(l.client_id, klaviyoKey);
  const field = (k: string) => String(answers[k] ?? "").trim().slice(0, 8000);
  const md = [`# ${l.clients.name} — internal setup (current client)`, `Submitted ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC by the Fluid team · Klaviyo: ${klaviyo}`, "",
    "## Brand guidelines", ...(files.length ? files.map((f) => `- brand/guidelines/${f}`) : ["_(no files)_"]), link ? `- Link: ${link}` : "", "",
    `## Sender name\n${field("sender") || "_(not given)_"}\n`, `## Notes from the team\n${field("notes") || "_(none)_"}\n`];
  writeFileSync(join(CLIENTS_DIR, l.clients.folder, "onboarding", "internal-setup.md"), md.join("\n"));
  await db().from("onboarding_links").update({ revoked_at: new Date().toISOString() }).eq("id", l.id);
  return { clientId: l.client_id, folder: l.clients.folder, name: l.clients.name, klaviyo, internal: true };
}

/** Save the form: answers → profile_answers + onboarding/form-answers.md; Klaviyo key → vault (after a live check). */
export async function saveForm(token: string, answers: Record<string, unknown>, klaviyoKey?: string) {
  const l = await formLink(token);
  if (!l) throw new Error("This onboarding link has expired or was already used.");
  const allowed = new Map<string, unknown>(formSections().flatMap((s) => s.questions).map((q) => [q.id, q]));
  allowed.set("notes", { id: "notes" });
  const rows = Object.entries(answers).filter(([k, v]) => allowed.has(k) && v != null && String(v).trim() !== "").map(([k, v]) => ({ client_id: l.client_id, question_id: k, answer: typeof v === "string" ? v.slice(0, 8000) : v }));
  if (rows.length) await db().from("profile_answers").upsert(rows);
  const klaviyo = await storeKlaviyoKey(l.client_id, klaviyoKey);
  const md = [`# ${l.clients.name} — onboarding form`, `Submitted ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · Klaviyo: ${klaviyo}`, ""];
  for (const s of formSections()) {
    md.push(`## ${s.title}`);
    for (const q of s.questions) if (q.type !== "connection") md.push(`**${q.label}**\n${String((answers as any)[q.id] ?? "").trim() || "_(blank)_"}\n`);
  }
  if (String((answers as any).notes ?? "").trim()) md.push(`## Notes from the client\n${String((answers as any).notes).trim()}\n`);
  const keyOnly = hasExistingForm(l.clients.folder);
  writeFileSync(join(CLIENTS_DIR, l.clients.folder, "onboarding", keyOnly ? "klaviyo-connected.md" : "form-answers.md"), keyOnly ? md.filter((x, i) => i < 2 || x.startsWith("## Notes") || md[i - 1]?.startsWith("## Notes")).join("\n") : md.join("\n"));
  await db().from("onboarding_links").update({ revoked_at: new Date().toISOString() }).eq("id", l.id); // one submission per link
  return { clientId: l.client_id, folder: l.clients.folder, name: l.clients.name, klaviyo };
}

/** Klaviyo audit + order data (read-only scripts) into research/, using the client's key from the vault. */
export async function runAudits(clientId: string, folder: string) {
  const { data: key } = await db().rpc("get_connection_secret", { p_client: clientId, p_provider: "klaviyo" });
  if (!key) return { klaviyo: false, notes: ["No Klaviyo key, so no audit: onboarding works from the form and the website."] };
  const notes: string[] = [];
  const env = { ...process.env, KLAVIYO_AUDIT_KEY: key as string };
  for (const [script, label] of [["scripts/klaviyo-audit.ts", "Klaviyo audit"], ["scripts/klaviyo-orders-audit.ts", "order data"]]) {
    try { await run("npx", ["tsx", script, folder], { cwd: ROOT, env, timeout: 15 * 60_000, maxBuffer: 20 * 1024 * 1024 }); notes.push(`${label}: done`); }
    catch (e: any) { notes.push(`${label}: failed (${String(e.stderr || e.message).split("\n").filter(Boolean).pop()?.slice(0, 160)})`); }
  }
  try { const { syncKlaviyo } = await import("../lib/klaviyo/sync"); const r = await syncKlaviyo(clientId); notes.push(`reporting sync: ${r.ok ? "done" : "failed"}`); } catch (e: any) { notes.push(`reporting sync: failed (${e.message})`); }
  const research = join(CLIENTS_DIR, folder, "research");
  return { klaviyo: true, notes, files: existsSync(research) ? readdirSync(research) : [] };
}

export const ONBOARDING_PROMPT = (name: string, auditNotes: string[], internal = false) => `Onboard ${name}. ${internal
  ? "This is a CURRENT Fluid client set up internally by the team (onboarding/internal-setup.md): there is no client form. Brand guidelines are in brand/guidelines/ (read every PDF and image; Word/PowerPoint files have a .txt copy). The guidelines are the source of truth for fonts, colours, voice and rules; use the website to fill gaps. In the flow plan, compare their live flows (from the audit) with the core system and mark each flow/email as keep, fix or build."
  : "This is the automatic onboarding run after the client submitted the form (onboarding/form-answers.md)."}
Audit status: ${auditNotes.join("; ")}. The audit and order JSON (if any) are in research/.
Follow ../../brain/skills/fluid-client-onboarding/SKILL.md fully and produce, in this folder:
1. brand/brand-kit.md from the website (fonts, colors, button style and CTA casing exactly as the site writes its buttons, imagery, trust points).
2. research/onboarding-doc.md: What has worked (Klaviyo top flows + last 30-60 days campaigns, best/worst), What sells (order data), the brand, avatars (problems, circumstances, desire, what keeps them up at night; "not applicable" where it doesn't fit), voice + proposed sender persona ("<Name> from <Brand>"), website conflicts, competitors.
3. strategy/<today>-month-1-plan.md: 12 email campaigns + 5 SMS for the first month, each email in the six-field brief format (Email Campaign name / Sent to / Discount / Angle / Goals / Excluding), audiences named from the segmentation master sheet (../../knowledge/sops/segmentation-master.md).
4. strategy/flow-plan.md: the core flow system, 22 emails + 7 SMS (Welcome with its 3 pop-up versions of email 1, Site abandonment, Browse abandonment, Abandoned cart with the mystery offer, Post-purchase with the plain-text founder email, Winback; SMS: Welcome x2, Browse x1, Abandoned cart x2, Post-purchase x1, Winback x1), filled in for this brand (../../brain/flows/OVERVIEW.md).
5. Append the key facts and open questions to memory.md.
Then call publish_doc for the onboarding doc, the month-1 plan and the flow plan, and reply with just the three links, one per line, plus one line listing the open questions that block anything.`;
