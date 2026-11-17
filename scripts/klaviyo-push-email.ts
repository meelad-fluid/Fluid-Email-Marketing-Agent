// Slices a finished design into a Klaviyo email and (with --push) creates it in the client's Klaviyo as a DRAFT.
// Never sends or schedules: writes go through lib/klaviyo/write.ts, which only allows draft-building calls and
// requires clients.klaviyo_write = 'drafts'.
//
// Usage: npx tsx scripts/klaviyo-push-email.ts <client-folder> <design-folder> [--push] [--code] [--new-campaign]
//   Templates are drag-and-drop (Klaviyo's editor) by default; --code makes a custom-HTML template instead.
//   If build/klaviyo.json already has a draft campaign, the new template is assigned to that same draft
//   (no duplicate drafts) unless --new-campaign.
//   e.g. npx tsx scripts/klaviyo-push-email.ts dolce designs/2026-11-18-freematcha-last-call
// Output (always): <design-folder>/build/ slices, email.html (preview), qc.md, qc-sheet.png
// With --push: images uploaded, template created, draft campaign created with the template, build/klaviyo.json
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { dcToHtml, sliceEmail } from "../lib/email/slicer";
import { draftWriter } from "../lib/klaviyo/write";
import { klaviyoAll } from "../lib/klaviyo/api";
import { dndDefinition, DND_REVISION } from "../lib/email/klaviyo-dnd";

for (const [, k, v] of readFileSync(join(__dirname, "../.env.local"), "utf8").matchAll(/^([A-Z_]+)=(.*)$/gm)) process.env[k] ??= v.trim();

const [folder, designRel] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const PUSH = process.argv.includes("--push");
const CODE = process.argv.includes("--code");
const NEW_CAMPAIGN = process.argv.includes("--new-campaign");
if (!folder || !designRel) throw new Error("Usage: klaviyo-push-email.ts <client-folder> <design-folder> [--push]");
const clientDir = resolve(__dirname, "../clients", folder);
const designDir = resolve(clientDir, designRel);
const buildDir = join(designDir, "build");

function copyMeta() {
  const readme = existsSync(join(designDir, "README.md")) ? readFileSync(join(designDir, "README.md"), "utf8") : "";
  const copyRel = readme.match(/^Copy:\s*(\S+)/m)?.[1];
  const copyFile = copyRel ? resolve(designDir, copyRel) : "";
  const c = copyFile && existsSync(copyFile) ? readFileSync(copyFile, "utf8") : "";
  const pick = (re: RegExp) => c.match(re)?.[1]?.trim() ?? "";
  const names = (s: string) => s.split(/\s\+\s|;\s*/).map((x) => x.trim()).filter((x) => x && /^FC \||^[A-Z]{2,} \||^HIGH VALUE|^[A-Z][\w ]+ - /.test(x) && !/segment to build/i.test(x));
  return {
    name: (readme.match(/^# (.+?)(:| —|$)/m)?.[1] ?? designRel).trim(),
    subject: pick(/^SUBJECT \(pick\):\s*(.+)$/m),
    preview: pick(/^PREVIEW \(pick\):\s*(.+)$/m),
    fromLabel: pick(/^From:\s*([^(\n]+)/m).replace(/\s+$/, ""),
    included: names(pick(/^Sent to:\s*(.+)$/m)),
    excluded: names(pick(/^Excluding:\s*(.+)$/m)),
    copyFile,
  };
}

async function main() {
  const meta = copyMeta();
  if (!meta.subject || !meta.preview) throw new Error(`Couldn't find SUBJECT (pick) / PREVIEW (pick) in the copy file (${meta.copyFile || "no Copy: line in README"})`);
  const dc = join(designDir, "design.dc.html");
  const src = existsSync(dc) ? dc : join(designDir, "email.html");
  const local = join(buildDir, "source.html");
  writeFileSync((require("node:fs").mkdirSync(buildDir, { recursive: true }), local), src.endsWith(".dc.html") ? dcToHtml(src, clientDir) : readFileSync(src, "utf8"));

  const r = await sliceEmail(local, buildDir, { subject: meta.subject, preview: meta.preview });
  writeFileSync(join(buildDir, "email.html"), r.html(r.slices.map((s) => `slice-${String(s.i).padStart(2, "0")}.jpg`), r.footer.logo));
  writeFileSync(join(buildDir, "qc.md"), r.qcMd);
  console.log(r.qcMd);
  console.log(`\nPreview: ${join(buildDir, "email.html")}\nQC sheet: ${r.qcPng}`);
  if (!PUSH) return console.log("\nDry run: nothing sent to Klaviyo. Add --push to create the draft.");

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data: client } = await db.from("clients").select("id, name").eq("folder", folder).single();
  if (!client) throw new Error(`No client with folder ${folder}`);
  if (r.links.some((l) => !l.ok)) throw new Error("A link failed QC; fix it before pushing.");
  const k = await draftWriter(db, client.id); // throws unless this client allows drafts

  const uploaded: { id: string; url: string }[] = [];
  for (const s of r.slices) uploaded.push(await k.upload(readFileSync(s.file), `${folder}-${meta.name}-${s.i}.jpg`.replace(/[^\w.-]+/g, "-"), "image/jpeg"));
  const urls = uploaded.map((u) => u.url);
  let logo: { id: string; url: string } | undefined;
  if (r.footer.logo?.startsWith("file:")) logo = await k.upload(readFileSync(new URL(r.footer.logo)), `${folder}-footer-logo.png`, "image/png");
  const logoUrl = logo?.url;

  const firstHref = r.slices.find((s) => s.href?.startsWith("http"))?.href;
  const homepage = firstHref ? new URL(firstHref).origin + "/" : undefined; // footer logo → homepage
  const tName = `FC | ${meta.name} (${CODE ? "sliced HTML" : "sliced"})`;
  const tpl = CODE
    ? await k.post("/templates", { data: { type: "template", attributes: { name: tName, editor_type: "CODE", html: r.html(urls, logoUrl), text: r.text } } }, tName)
    : await k.post("/templates", { data: { type: "template", attributes: { name: tName, editor_type: "SYSTEM_DRAGGABLE", text: r.text,
        definition: dndDefinition(r.slices.map((s, i) => ({ src: uploaded[i].url, assetId: uploaded[i].id, href: s.href, alt: s.alt })), { bg: r.footer.bg, legal: r.footer.legal, logo: logo ? { src: logo.url, assetId: logo.id, alt: client.name, href: homepage } : undefined }) } } }, tName, DND_REVISION);
  const templateId = tpl.data.id;

  // Reuse the existing draft (assign the new template to its message) instead of creating another draft.
  const prevFile = join(buildDir, "klaviyo.json");
  const prev = existsSync(prevFile) ? JSON.parse(readFileSync(prevFile, "utf8")) : null;
  if (prev?.campaign?.message_id && !NEW_CAMPAIGN) {
    await k.post("/campaign-message-assign-template", { data: { type: "campaign-message", id: prev.campaign.message_id, relationships: { template: { data: { type: "template", id: templateId } } } } }, "assign template (reuse draft)");
    const out = { ...prev, template_id: templateId, template_name: tName, editor: CODE ? "CODE" : "SYSTEM_DRAGGABLE", images: urls, previous_template_id: prev.template_id };
    writeFileSync(prevFile, JSON.stringify(out, null, 2));
    return console.log("\nUpdated the existing draft with the new template (draft, not scheduled):", JSON.stringify({ campaign: out.campaign, template_id: templateId, template_name: tName }, null, 2));
  }

  // Audiences by exact name (lists + segments).
  const { data: key } = await db.rpc("get_connection_secret", { p_client: client.id, p_provider: "klaviyo" });
  const [lists, segs] = await Promise.all([klaviyoAll<any>(key, "/lists/?fields[list]=name"), klaviyoAll<any>(key, "/segments/?fields[segment]=name")]);
  // Match on a normalized name (case, spacing, punctuation); fall back to "the group's name starts with this text"
  // so a copy doc can say "FC | BFCM 2026 free-matcha buyers" for "FC | BFCM 2026 free-matcha buyers ($160+ order Nov 15-19)".
  const key2 = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9$+ |]/g, "").trim();
  const groupsAll = [...lists.data, ...segs.data].map((g: any) => ({ id: g.id, k: key2(g.attributes.name) }));
  const find = (n: string) => groupsAll.find((g) => g.k === key2(n))?.id ?? (() => { const hits = groupsAll.filter((g) => g.k.startsWith(key2(n.replace(/\(.*?\)/g, "")))); return hits.length === 1 ? hits[0].id : undefined; })();
  const resolveNames = (ns: string[]) => ns.map((n) => ({ n, id: find(n) }));
  const inc = resolveNames(meta.included), exc = resolveNames(meta.excluded);
  const missing = [...inc, ...exc].filter((x) => !x.id).map((x) => x.n);
  const out: any = { template_id: templateId, template_name: tName, images: urls, missing_audiences: missing };
  if (!inc.some((x) => x.id)) {
    out.campaign = null;
    out.note = "No included audience matched a Klaviyo list/segment name, so only the template was created.";
  } else {
    const cName = `DRAFT · ${meta.name}`;
    const camp = await k.post("/campaigns", {
      data: { type: "campaign", attributes: {
        name: cName,
        audiences: { included: inc.filter((x) => x.id).map((x) => x.id), excluded: exc.filter((x) => x.id).map((x) => x.id) },
        "campaign-messages": { data: [{ type: "campaign-message", attributes: { definition: { channel: "email", label: meta.name, content: { subject: meta.subject, preview_text: meta.preview, ...(meta.fromLabel ? { from_label: meta.fromLabel } : {}) } } } }] },
      } },
    }, cName);
    const messageId = camp.data.relationships?.["campaign-messages"]?.data?.[0]?.id;
    await k.post("/campaign-message-assign-template", { data: { type: "campaign-message", id: messageId, relationships: { template: { data: { type: "template", id: templateId } } } } }, "assign template");
    out.campaign = { id: camp.data.id, name: cName, message_id: messageId, status: camp.data.attributes?.status, url: `https://www.klaviyo.com/campaign/${camp.data.id}/wizard` };
  }
  writeFileSync(join(buildDir, "klaviyo.json"), JSON.stringify(out, null, 2));
  console.log("\nIn Klaviyo (draft, not scheduled):", JSON.stringify(out, null, 2));
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
