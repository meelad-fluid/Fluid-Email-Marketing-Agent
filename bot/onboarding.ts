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
import { checkConn, normalizeShop, shopifyConn, tokenFor } from "../lib/shopify/client";
import { shopifyAnalytics } from "../lib/shopify/analytics";

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

/** Onboard a client inside the channel this was run in (the client's existing internal channel). No new
 * channels: the channel is linked to the client (made if it doesn't exist yet) and gets the internal setup link. */
export async function setupInChannel(web: WebClient, o: { name: string; website?: string; channelId: string; requestedBy: string; teamId: string }) {
  const name = o.name.trim();
  // The website is optional: the onboarding finds it in the uploaded doc when it isn't given.
  const site = o.website?.trim();
  const website = site ? (/^https?:\/\//.test(site) ? site : `https://${site}`) : null;
  if (website) new URL(website); // throws on a bad URL
  if (o.channelId.startsWith("D")) throw new Error("Run this inside the client's internal channel, not a DM.");
  // Reuse an existing folder for this brand: the channel's own client, else a website-domain or name match, else a new one.
  const { data: here } = await db().from("slack_channels").select("clients(folder, name)").eq("channel_id", o.channelId).maybeSingle();
  const hereFolder = (here as any)?.clients?.folder as string | undefined;
  const domain = website ? new URL(website).hostname.replace(/^www\./, "").toLowerCase() : null;
  const dirs = readdirSync(CLIENTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith("_")).map((d) => d.name);
  const existingFolder = (hereFolder && slugify((here as any).clients.name) === slugify(name) ? hereFolder : undefined)
    ?? (domain ? dirs.find((d) => ["README.md", "memory.md", "brand/brand-kit.md"].some((f) => existsSync(join(CLIENTS_DIR, d, f)) && readFileSync(join(CLIENTS_DIR, d, f), "utf8").toLowerCase().includes(domain))) : undefined)
    ?? dirs.find((d) => d === slugify(name));
  const slug = existingFolder ?? slugify(name);
  if (!slug) throw new Error("That brand name doesn't make a usable folder name.");

  // This channel must not already belong to a different client.
  const { data: linked } = await db().from("slack_channels").select("clients(id, folder, name)").eq("channel_id", o.channelId).maybeSingle();
  const lc = (linked as any)?.clients;
  if (lc && lc.folder !== slug) throw new Error(`This channel already belongs to ${lc.name}. Run it in ${name}'s own channel.`);

  let { data: client } = await db().from("clients").select("id, folder").or(`folder.eq.${slug},slug.eq.${slug}`).maybeSingle();
  if (!client) {
    const ins = await db().from("clients").insert({ name, slug, folder: slug, website_url: website, status: "onboarding" }).select("id, folder").single();
    if (ins.error) throw ins.error;
    client = ins.data;
  }
  makeFolder(slug, name);
  if (!existsSync(join(CLIENTS_DIR, slug, "onboarding", "README.md"))) writeFileSync(join(CLIENTS_DIR, slug, "onboarding", "README.md"), `# Onboarding\nWebsite: ${website ?? "not given (find it in the onboarding doc)"}\nStarted from Slack by <@${o.requestedBy}> on ${new Date().toISOString().slice(0, 10)}.\n`);
  await saveClientFolder(slug, `${slug}: ${existingFolder ? "connected existing client" : "new client"} ${name} (via Slack)`);
  await linkChannel(o.channelId, o.teamId, slug, name, o.requestedBy);

  const url = await internalLink(client!.id);
  const { data: link } = await db().from("onboarding_links").select("id").eq("client_id", client!.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  await db().from("onboarding_runs").insert({ client_id: client!.id, link_id: link?.id ?? null, started_by: o.requestedBy });
  await web.chat.postMessage({ channel: o.channelId, text: INTERNAL_MSG(name, url) });
  return { slug, channelId: o.channelId, url, clientId: client!.id as string };
}

/** True when the client's form is already in the folder (filled outside the app), so the link only needs the Klaviyo key. */
export function hasExistingForm(folder: string) {
  const onb = join(CLIENTS_DIR, folder, "onboarding");
  return existsSync(onb) && readdirSync(onb).some((f) => /form/i.test(f) && !/^form-answers\.md$/.test(f));
}

const INTERNAL_MSG = (name: string, url: string) => `*${name}* onboarding (Fluid team only): ${url}\nUpload their onboarding doc (PDF), add the Klaviyo or Customer.io key and their Shopify app credentials if you have them, and I'll run the onboarding here. The link works once and expires in 14 days.`;

/** A one-use link for the Fluid team: brand guidelines upload + Klaviyo key, for clients we already work with. */
export async function internalLink(clientId: string) {
  const token = randomBytes(24).toString("base64url");
  await db().from("onboarding_links").insert({ client_id: clientId, token_hash: hashToken(token), kind: "internal", expires_at: new Date(Date.now() + 14 * 86400_000).toISOString() });
  return `${publicUrl()}/onboard/${token}`;
}

/** A one-use page for the Fluid team to connect (or reconnect) a client's Shopify store. */
export async function shopifyLink(clientId: string) {
  const token = randomBytes(24).toString("base64url");
  await db().from("onboarding_links").insert({ client_id: clientId, token_hash: hashToken(token), kind: "shopify", expires_at: new Date(Date.now() + 14 * 86400_000).toISOString() });
  return `${publicUrl()}/onboard/${token}`;
}

/** Verify Shopify credentials (store + Admin token, or Dev Dashboard Client ID + secret) and store them encrypted. */
export async function storeShopify(clientId: string, input: { shop?: string; client_id?: string; secret?: string }) {
  if (!input.shop?.trim() && !input.secret?.trim()) return null;
  const shop = normalizeShop(input.shop ?? "");
  if (!shop) throw new Error("Use the store's .myshopify.com address (Shopify admin → Settings → Domains).");
  const secret = (input.secret ?? "").trim(), appId = (input.client_id ?? "").trim() || undefined;
  if (!secret) throw new Error("Add the app's Client secret (shpss_…) or an Admin API token (shpat_…).");
  const token = await tokenFor(shop, secret, appId);
  const check = await checkConn({ shop, token });
  const { error } = await db().rpc("store_connection_secret", { p_client: clientId, p_provider: "shopify", p_secret: secret, p_meta: { shop, ...(appId ? { client_id: appId } : {}), via: appId ? "client_credentials" : "token", missing_read: check.missing_read, can_create_discounts: check.can_create_discounts }, p_account_name: check.name });
  if (error) throw new Error("Couldn't store the Shopify credentials securely.");
  return { ...check, shop };
}

/** Save the Shopify-only page (kind 'shopify'): store the connection, nothing else runs. */
export async function saveShopifyForm(token: string, input: { shop?: string; client_id?: string; secret?: string }) {
  const l = await formLink(token);
  if (!l || l.kind !== "shopify") throw new Error("This link has expired or was already used.");
  const r = await storeShopify(l.client_id, input);
  if (!r) throw new Error("Add the store and its credentials.");
  await db().from("onboarding_links").update({ revoked_at: new Date().toISOString() }).eq("id", l.id);
  return { clientId: l.client_id, folder: l.clients.folder, name: l.clients.name, shopify: r };
}

/** Shopify part of the audit: orders (best sellers, AOV, repeat rate, cohorts) + Shopify Analytics, into research/. */
export async function shopifyAudit(clientId: string, folder: string): Promise<string[]> {
  let conn;
  try { conn = await shopifyConn(db(), clientId); } catch (e: any) { return [`Shopify: couldn't connect (${e.message.slice(0, 140)})`]; }
  if (!conn) return ["Shopify: not connected (orders come from Klaviyo's Shopify events instead, if available)"];
  const notes: string[] = [], research = join(CLIENTS_DIR, folder, "research"), day = new Date().toISOString().slice(0, 10);
  mkdirSync(research, { recursive: true });
  try { await run("npx", ["tsx", "scripts/shopify-audit.ts", folder], { cwd: ROOT, env: { ...process.env, SHOPIFY_SHOP: conn.shop, SHOPIFY_ACCESS_TOKEN: conn.token }, timeout: 15 * 60_000, maxBuffer: 20 * 1024 * 1024 }); notes.push("Shopify orders: done"); }
  catch (e: any) { notes.push(`Shopify orders: failed (${String(e.stderr || e.message).split("\n").filter(Boolean).pop()?.slice(0, 160)})`); }
  try {
    const a = await shopifyAnalytics(conn);
    writeFileSync(join(research, `shopify-analytics-${day}.json`), JSON.stringify(a, null, 2));
    const failed = Object.entries(a).filter(([, v]: any) => v?.error).length;
    notes.push(`Shopify analytics: done${failed ? ` (${failed} report${failed > 1 ? "s" : ""} unavailable)` : ""}`);
  } catch (e: any) { notes.push(`Shopify analytics: failed (${e.message.slice(0, 160)})`); }
  return notes;
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
  return data as any as { id: string; client_id: string; kind: "client" | "internal" | "shopify"; clients: { name: string; folder: string; website_url: string } };
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

/** Word/PowerPoint → a .txt copy next to it (<file>.txt) that the agent can read. Returns the .txt path, or null. */
export async function extractOfficeText(file: string): Promise<string | null> {
  const py = `import sys,zipfile,re\nz=zipfile.ZipFile(sys.argv[1]);out=[]\nnames=sorted([n for n in z.namelist() if n=="word/document.xml" or re.match(r"ppt/slides/slide\\d+\\.xml$",n)],key=lambda n:int(re.sub(r"\\D","",n) or 0))\nfor n in names:\n  x=z.read(n).decode("utf8","ignore");x=re.sub(r"</(w|a):p>","\\n",x);out.append(re.sub(r"<[^>]+>","",x))\nprint("\\n\\n".join(out))`;
  try { const { stdout } = await run("python3", ["-I", "-c", py, file], { maxBuffer: 20 * 1024 * 1024, timeout: 60_000 }); writeFileSync(`${file}.txt`, stdout); return `${file}.txt`; } catch { return null; /* the original file is still there */ }
}

/** Save one onboarding file (the client's answers doc, brand guidelines…) into onboarding/docs/ (Word/PowerPoint also get a .txt copy the agent can read). */
export async function saveUpload(token: string, filename: string, data: Buffer) {
  const l = await formLink(token);
  if (!l || l.kind !== "internal") throw new Error("This link has expired or was already used.");
  const ext = extname(filename).toLowerCase();
  if (!UPLOAD_TYPES.has(ext)) throw new Error(`${filename}: use PDF, images, Word, PowerPoint or text files.`);
  if (!data.length || data.length > MAX_UPLOAD) throw new Error(`${filename} is too big (30 MB max per file).`);
  const safe = basename(filename, ext).replace(/[^A-Za-z0-9._ -]+/g, "").trim().replace(/\s+/g, "-").slice(0, 80) || "guidelines";
  const dir = join(CLIENTS_DIR, l.clients.folder, "onboarding", "docs");
  mkdirSync(dir, { recursive: true });
  let name = `${safe}${ext}`;
  for (let i = 2; existsSync(join(dir, name)); i++) name = `${safe}-${i}${ext}`;
  writeFileSync(join(dir, name), data);
  if (ext === ".docx" || ext === ".pptx") await extractOfficeText(join(dir, name));
  return name;
}

/** Save the internal onboarding upload: files are already in onboarding/docs/; the key (Klaviyo or Customer.io, optional) goes to the vault. */
export async function saveInternalForm(token: string, answers: Record<string, unknown>, key?: string, shopify?: { shop?: string; client_id?: string; secret?: string }) {
  const l = await formLink(token);
  if (!l || l.kind !== "internal") throw new Error("This link has expired or was already used.");
  const dir = join(CLIENTS_DIR, l.clients.folder, "onboarding", "docs");
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => !f.endsWith(".txt") || !existsSync(join(dir, f.slice(0, -4)))) : [];
  if (!files.length) throw new Error("Upload the onboarding doc first.");
  const platform = String(answers.platform ?? "none");
  let connection = "not connected yet";
  if (key?.trim() && platform === "klaviyo") connection = `Klaviyo ${await storeKlaviyoKey(l.client_id, key)}`;
  else if (key?.trim() && platform === "customerio") connection = `Customer.io ${await storeCioKey(l.client_id, key)}`;
  const esp = platform === "customerio" ? "Customer.io" : platform === "klaviyo" ? "Klaviyo" : "not given";
  const shop = shopify ? await storeShopify(l.client_id, shopify) : null;
  const shopLine = shop ? `Shopify: connected (${shop.name}, ${shop.shop})${shop.missing_read.length ? `, missing ${shop.missing_read.join(", ")}` : ""}${shop.can_create_discounts ? ", can create discount codes" : ", read only (no write_discounts)"}` : "Shopify: not connected";
  const notes = String(answers.notes ?? "").trim().slice(0, 8000);
  writeFileSync(join(CLIENTS_DIR, l.clients.folder, "onboarding", "internal-setup.md"), [
    `# ${l.clients.name} — onboarding upload`, `Submitted ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC by the Fluid team`, "",
    `Email platform: ${esp} (${connection})`, shopLine, "", "## Files", ...files.map((f) => `- onboarding/docs/${f}`), "", `## Notes from the team\n${notes || "_(none)_"}\n`].join("\n"));
  const mem = join(CLIENTS_DIR, l.clients.folder, "memory.md");
  if (existsSync(mem) && esp !== "not given" && !/^Email platform:/m.test(readFileSync(mem, "utf8"))) writeFileSync(mem, readFileSync(mem, "utf8").trimEnd() + `\n\nEmail platform: ${esp}\n`);
  await db().from("onboarding_links").update({ revoked_at: new Date().toISOString() }).eq("id", l.id);
  return { clientId: l.client_id, folder: l.clients.folder, name: l.clients.name, klaviyo: connection, internal: true };
}

async function storeCioKey(clientId: string, key: string) {
  const { verifyCioKey } = await import("../lib/customerio/api");
  const v = await verifyCioKey(key.trim());
  if (!v) throw new Error("That Customer.io key didn't work. Use an App API key (Settings → API Credentials → App API Keys).");
  const { error } = await db().rpc("store_connection_secret", { p_client: clientId, p_provider: "customerio", p_secret: key.trim(), p_meta: { region: v.region }, p_account_name: null });
  if (error) throw new Error("Couldn't store the Customer.io key securely.");
  return `connected (${v.region.toUpperCase()} data center)`;
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
  const shop = await shopifyAudit(clientId, folder);
  const r = await espAudits(clientId, folder);
  return { ...r, notes: [...r.notes, ...shop] };
}

async function espAudits(clientId: string, folder: string): Promise<{ klaviyo: boolean; customerio?: boolean; notes: string[]; files?: string[] }> {
  const { data: key } = await db().rpc("get_connection_secret", { p_client: clientId, p_provider: "klaviyo" });
  if (!key) {
    const { cioCreds } = await import("../lib/customerio/api");
    const cio = await cioCreds(db(), clientId);
    if (!cio) return { klaviyo: false, notes: ["No Klaviyo or Customer.io key, so no account audit: onboarding works from the uploaded doc and the website."] };
    try {
      const { cioAudit } = await import("../lib/customerio/report");
      const a = await cioAudit(cio);
      const research = join(CLIENTS_DIR, folder, "research"); mkdirSync(research, { recursive: true });
      writeFileSync(join(research, `customerio-audit-${new Date().toISOString().slice(0, 10)}.json`), JSON.stringify(a, null, 2));
      return { klaviyo: false, customerio: true, notes: [`Customer.io audit: done (${Array.isArray(a.automations) ? a.automations.length : 0} automations, ${Array.isArray(a.segments) ? a.segments.length : 0} segments, order event: ${(a.order_event as any)?.name ?? "none found"})`], files: readdirSync(research) };
    } catch (e: any) { return { klaviyo: false, notes: [`Customer.io audit: failed (${e.message.slice(0, 160)})`] }; }
  }
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
  ? "This client was set up internally by the Fluid team (onboarding/internal-setup.md). If onboarding/README.md says the website was not given, find it in the uploaded doc (or search the web for the brand) and write it as a line \"Website: https://…\" in onboarding/README.md and memory.md before anything else. Their onboarding answers and any brand guidelines are the files in onboarding/docs/: read every PDF fully (in page ranges if long) and any images; Word/PowerPoint files have a .txt copy. Those answers replace the client form, and brand guidelines are the source of truth for fonts, colours, voice and rules; use the website to fill gaps. The email platform is in internal-setup.md: if it is Customer.io, the account audit is research/customerio-audit-*.json and everything you plan must work in Customer.io (read ../../brain/skills/fluid-customerio/SKILL.md). In the flow plan, compare their live flows (from the audit) with the core system and mark each flow/email as keep, fix or build."
  : "This is the automatic onboarding run after the client submitted the form (onboarding/form-answers.md)."}
Audit status: ${auditNotes.join("; ")}. The audit and order JSON (if any) are in research/. Shopify (if connected): research/shopify-audit-*.json (orders: best sellers, first-order products, AOV spread, repeat rate and days to 2nd order, product paths, cohorts) and research/shopify-analytics-*.json (Shopify Analytics: sales trend, new vs returning, top products, sessions, conversion, traffic sources, devices, landing pages, cart/checkout funnel). Shopify numbers beat Klaviyo's order events when both exist.
Follow ../../brain/skills/fluid-client-onboarding/SKILL.md fully and produce, in this folder (for a research-use-only peptide brand, write compliance.md first and use research-buyer avatars, per the skill's RUO section; never human benefits. It's a profile, not a gate: no classification or HOLD/ESCALATE status, and every plan is written like any client's):
1. The brand book (save_brand_book; it writes brand/brand-kit.md) from the website and any brand guide in onboarding/docs (fonts, colors, button style and CTA casing exactly as the site writes its buttons, logos, imagery, trust points). Also store the uploaded guides and any past email designs in the client library (save_to_library).
2. research/onboarding-doc.md: What has worked (Klaviyo top flows + last 30-60 days campaigns, best/worst), What sells (order data), Store analytics (Shopify: traffic, conversion, mobile share, new vs returning revenue, funnel drop-off, and what each means for email; skip if not connected), the brand, avatars (problems, circumstances, desire, what keeps them up at night; "not applicable" where it doesn't fit) and, for each avatar, the "their world" bank (../../brain/skills/fluid-email-copywriter/references/customer-research.md §4: what they do, 8–12 moments, calendar and rituals, 40–60 verbatim customer lines from reviews and the wider category, trade language, real uses, doubts, who they buy for). It's the foundation of all copy, so research it properly now, voice + proposed sender persona ("<Name> from <Brand>"), website conflicts, competitors.
3. strategy/<today>-month-1-plan.md: 12 email campaigns + 5 SMS for the first month, each email in the six-field brief format (Email Campaign name / Sent to / Discount / Angle / Goals / Excluding), audiences named from the segmentation master sheet (../../knowledge/sops/segmentation-master.md).
4. strategy/flow-plan.md: the core flow system, 22 emails + 7 SMS (Welcome with its 3 pop-up versions of email 1, Site abandonment, Browse abandonment, Abandoned cart with the mystery offer, Post-purchase with the plain-text founder email, Winback; SMS: Welcome x2, Browse x1, Abandoned cart x2, Post-purchase x1, Winback x1), filled in for this brand (../../brain/flows/OVERVIEW.md).
5. Append the key facts and open questions to memory.md.
Write all three docs and the Slack summary in the format in ../../knowledge/sops/readable-writing.md (lists and sub-bullets, never dense paragraphs). Then call publish_doc for the onboarding doc, the month-1 plan and the flow plan, and reply with the three docs as hyperlinked names, one per line (e.g. "[Onboarding Doc](link)"), then the open questions that block anything as a short numbered list. No raw URLs.`;
