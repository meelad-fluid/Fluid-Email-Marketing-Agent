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
import { join } from "node:path";
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

export async function startNewClient(web: WebClient, o: { name: string; website: string; requestedBy: string; teamId: string }) {
  const name = o.name.trim();
  const website = /^https?:\/\//.test(o.website.trim()) ? o.website.trim() : `https://${o.website.trim()}`;
  new URL(website); // throws on a bad URL
  let slug = slugify(name);
  if (!slug) throw new Error("That brand name doesn't make a usable folder name.");
  // An existing folder (set up by hand earlier) is kept as it is and connected; only a client already in the database clashes.
  const { data: clash } = await db().from("clients").select("id, folder").or(`folder.eq.${slug},slug.eq.${slug}`).maybeSingle();
  if (clash) throw new Error(`A client with the folder "${slug}" already exists.`);

  const { data: client, error } = await db().from("clients").insert({ name, slug, folder: slug, website_url: website, status: "onboarding" }).select("id").single();
  if (error) throw error;
  makeFolder(slug, name);
  writeFileSync(join(CLIENTS_DIR, slug, "onboarding", "README.md"), `# Onboarding\nWebsite: ${website}\nStarted from Slack by <@${o.requestedBy}> on ${new Date().toISOString().slice(0, 10)}.\n`);
  await saveClientFolder(slug, `${slug}: new client ${name} (via Slack)`);

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
  const { data: link } = await db().from("onboarding_links").insert({ client_id: client.id, token_hash: hashToken(token) }).select("id").single();
  await db().from("onboarding_runs").insert({ client_id: client.id, link_id: link?.id ?? null, started_by: o.requestedBy });
  const url = `${publicUrl()}/onboard/${token}`;
  const onb = join(CLIENTS_DIR, slug, "onboarding");
  const hasForm = existsSync(onb) && readdirSync(onb).some((f) => /form/i.test(f) && !/form-answers/.test(f));
  await web.chat.postMessage({ channel: channelId, text: hasForm
    ? `*${name}* is set up (${website}). Their onboarding form is already in the folder, so they don't need to fill it in again.\nSend them this link only to connect Klaviyo: ${url}\nOr say \`@fluid run the onboarding\` to start now from the form and the website, and I'll add the Klaviyo audit once they connect.`
    : `New client: *${name}* (${website}).\nSend this onboarding link to the client: ${url}\nOnce they submit it I'll run the Klaviyo audit and research, then post the Onboarding Doc and the first month's plan here.` });
  return { slug, channelId, url, clientId: client.id };
}

/** Questions shown on the client form (files are replaced by a shared-folder link; Shopify is connected later). */
export const formSections = () => SECTIONS.map((s) => ({ ...s, questions: s.questions.filter((q) => q.type !== "files" && !(q.type === "connection" && q.provider === "shopify")) })).filter((s) => s.questions.length);

export async function formLink(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const { data } = await db().from("onboarding_links").select("id, client_id, expires_at, revoked_at, clients(name, folder, website_url)").eq("token_hash", hashToken(token)).maybeSingle();
  if (!data || data.revoked_at || Date.parse(data.expires_at) < Date.now()) return null;
  return data as any as { id: string; client_id: string; clients: { name: string; folder: string; website_url: string } };
}

/** Save the form: answers → profile_answers + onboarding/form-answers.md; Klaviyo key → vault (after a live check). */
export async function saveForm(token: string, answers: Record<string, unknown>, klaviyoKey?: string) {
  const l = await formLink(token);
  if (!l) throw new Error("This onboarding link has expired or was already used.");
  const allowed = new Map(formSections().flatMap((s) => s.questions).map((q) => [q.id, q]));
  const rows = Object.entries(answers).filter(([k, v]) => allowed.has(k) && v != null && String(v).trim() !== "").map(([k, v]) => ({ client_id: l.client_id, question_id: k, answer: typeof v === "string" ? v.slice(0, 8000) : v }));
  if (rows.length) await db().from("profile_answers").upsert(rows);
  let klaviyo = "not provided";
  if (klaviyoKey?.trim()) {
    const key = klaviyoKey.trim();
    const r = await fetch("https://a.klaviyo.com/api/accounts/", { headers: { Authorization: `Klaviyo-API-Key ${key}`, revision: "2025-10-15", accept: "application/vnd.api+json" } });
    if (!r.ok) throw new Error("That Klaviyo key didn't work. It should be a Private API key that starts with pk_.");
    const acct: any = await r.json();
    const org = acct.data?.[0]?.attributes?.contact_information?.organization_name ?? null;
    const { error } = await db().rpc("store_connection_secret", { p_client: l.client_id, p_provider: "klaviyo", p_secret: key, p_meta: {}, p_account_name: org });
    if (error) throw new Error("Couldn't store the Klaviyo key securely.");
    klaviyo = `connected (${org ?? "account"})`;
  }
  const md = [`# ${l.clients.name} — onboarding form`, `Submitted ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · Klaviyo: ${klaviyo}`, ""];
  for (const s of formSections()) {
    md.push(`## ${s.title}`);
    for (const q of s.questions) if (q.type !== "connection") md.push(`**${q.label}**\n${String((answers as any)[q.id] ?? "").trim() || "_(blank)_"}\n`);
  }
  writeFileSync(join(CLIENTS_DIR, l.clients.folder, "onboarding", "form-answers.md"), md.join("\n"));
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

export const ONBOARDING_PROMPT = (name: string, auditNotes: string[]) => `Onboard ${name}. This is the automatic onboarding run after the client submitted the form (onboarding/form-answers.md).
Audit status: ${auditNotes.join("; ")}. The audit and order JSON (if any) are in research/.
Follow ../../brain/skills/fluid-client-onboarding/SKILL.md fully and produce, in this folder:
1. brand/brand-kit.md from the website (fonts, colors, button style and CTA casing exactly as the site writes its buttons, imagery, trust points).
2. research/onboarding-doc.md: What has worked (Klaviyo top flows + last 30-60 days campaigns, best/worst), What sells (order data), the brand, avatars (problems, circumstances, desire, what keeps them up at night; "not applicable" where it doesn't fit), voice + proposed sender persona ("<Name> from <Brand>"), website conflicts, competitors.
3. strategy/<today>-month-1-plan.md: 12 email campaigns + 5 SMS for the first month, each email in the six-field brief format (Email Campaign name / Sent to / Discount / Angle / Goals / Excluding), audiences named from the segmentation master sheet (../../knowledge/sops/segmentation-master.md).
4. strategy/flow-plan.md: the core flow system, 22 emails + 7 SMS (Welcome with its 3 pop-up versions of email 1, Site abandonment, Browse abandonment, Abandoned cart with the mystery offer, Post-purchase with the plain-text founder email, Winback; SMS: Welcome x2, Browse x1, Abandoned cart x2, Post-purchase x1, Winback x1), filled in for this brand (../../brain/flows/OVERVIEW.md).
5. Append the key facts and open questions to memory.md.
Then call publish_doc for the onboarding doc, the month-1 plan and the flow plan, and reply with just the three links, one per line, plus one line listing the open questions that block anything.`;
