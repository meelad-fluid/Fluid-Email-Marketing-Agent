// Turns a finished design into a Klaviyo email: render, slice (each section/CTA its own linked slice), QC,
// and with push=true upload the slices, create a drag-and-drop template and a DRAFT campaign (or reuse the
// design's existing draft). Writes only through lib/klaviyo/write.ts (drafts only, per-client permission).
// Used by scripts/klaviyo-push-email.ts and the Slack bot's push_to_klaviyo tool.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dcToHtml, sliceEmail } from "../email/slicer";
import { draftWriter } from "./write";
import { allAudiences, pick, rank } from "./audiences";
import { dndDefinition, DND_REVISION } from "../email/klaviyo-dnd";

export type PushResult = { qcMd: string; qcPng: string; preview: string; slices: number; warnings: string[]; linksOk: boolean; pushed: boolean; reusedDraft?: boolean; klaviyo?: any };

export function copyMeta(designDir: string, designRel: string) {
  const readme = existsSync(join(designDir, "README.md")) ? readFileSync(join(designDir, "README.md"), "utf8") : "";
  const copyRel = readme.match(/^Copy:\s*(\S+)/m)?.[1];
  const copyFile = copyRel ? resolve(designDir, copyRel) : "";
  const c = copyFile && existsSync(copyFile) ? readFileSync(copyFile, "utf8") : "";
  const pick = (re: RegExp) => c.match(re)?.[1]?.trim() ?? "";
  // Audience names from the copy doc: "A + B" or "A; B". Long descriptive phrases (segment definitions) are skipped.
  const names = (s: string) => s.split(/\s\+\s|;\s*|,\s+(?=FC \|)/).map((x) => x.replace(/\((?:segment to build|needs OK)[^)]*\)/gi, "").trim()).filter((x) => x && x.split(/\s+/).length <= 9 && !/segment to build|purchasers in the last|anyone who/i.test(x));
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

export async function pushEmail(o: { clientsDir: string; folder: string; designRel: string; db: SupabaseClient; push: boolean; code?: boolean; newCampaign?: boolean; include?: string[]; exclude?: string[]; log?: (s: string) => void }): Promise<PushResult> {
  const { folder, designRel, db } = o, PUSH = o.push, CODE = !!o.code, NEW_CAMPAIGN = !!o.newCampaign, log = o.log ?? (() => {});
  const clientDir = resolve(o.clientsDir, folder), designDir = resolve(clientDir, designRel), buildDir = join(designDir, "build");
  if (!designDir.startsWith(clientDir + sep)) throw new Error("Design must be inside the client folder");
  const meta = copyMeta(designDir, designRel);
  if (!meta.subject || !meta.preview) throw new Error(`Couldn't find SUBJECT (pick) / PREVIEW (pick) in the copy file (${meta.copyFile || "no Copy: line in README"})`);
  const dc = join(designDir, "design.dc.html");
  const src = existsSync(dc) ? dc : join(designDir, "email.html");
  const local = join(buildDir, "source.html");
  mkdirSync(buildDir, { recursive: true });
  writeFileSync(local, src.endsWith(".dc.html") ? dcToHtml(src, clientDir) : readFileSync(src, "utf8"));

  const r = await sliceEmail(local, buildDir, { subject: meta.subject, preview: meta.preview });
  writeFileSync(join(buildDir, "email.html"), r.html(r.slices.map((s) => (s.cols ? s.cols.map((_, j) => `slice-${String(s.i).padStart(2, "0")}-${j + 1}.jpg`) : `slice-${String(s.i).padStart(2, "0")}.jpg`)), r.footer.logo));
  writeFileSync(join(buildDir, "qc.md"), r.qcMd);
  log(r.qcMd);
  const base = { qcMd: r.qcMd, qcPng: r.qcPng, preview: join(buildDir, "email.html"), slices: r.slices.length, warnings: r.warnings, linksOk: r.links.every((l) => l.ok) };
  if (!PUSH) return { ...base, pushed: false };

  const { data: client } = await db.from("clients").select("id, name").eq("folder", folder).single();
  if (!client) throw new Error(`No client with folder ${folder}`);
  if (r.links.some((l) => !l.ok)) throw new Error("A link failed QC; fix it before pushing.");
  const k = await draftWriter(db, client.id); // throws unless this client allows drafts

  type Up = { id: string; url: string };
  const uploaded: (Up | Up[])[] = [];
  const nm = (x: string) => `${folder}-${meta.name}-${x}.jpg`.replace(/[^\w.-]+/g, "-");
  for (const s of r.slices) {
    if (s.cols) { const cs: Up[] = []; for (const [j, c] of s.cols.entries()) cs.push(await k.upload(readFileSync(c.file), nm(`${s.i}-${j + 1}`), "image/jpeg")); uploaded.push(cs); }
    else uploaded.push(await k.upload(readFileSync(s.file), nm(String(s.i)), "image/jpeg"));
  }
  const urls = uploaded.map((u) => (Array.isArray(u) ? u.map((x) => x.url) : u.url));
  let logo: { id: string; url: string } | undefined;
  if (r.footer.logo?.startsWith("file:")) logo = await k.upload(readFileSync(new URL(r.footer.logo)), `${folder}-footer-logo.png`, "image/png");
  const logoUrl = logo?.url;

  const firstHref = r.slices.flatMap((s) => (s.cols ? s.cols.map((c) => c.href) : [s.href])).find((h) => h?.startsWith("http"));
  const homepage = firstHref ? new URL(firstHref).origin + "/" : undefined; // footer logo → homepage
  const tName = `FC | ${meta.name} (${CODE ? "sliced HTML" : "sliced"})`;
  const tpl = CODE
    ? await k.post("/templates", { data: { type: "template", attributes: { name: tName, editor_type: "CODE", html: r.html(urls, logoUrl), text: r.text } } }, tName)
    : await k.post("/templates", { data: { type: "template", attributes: { name: tName, editor_type: "SYSTEM_DRAGGABLE", text: r.text,
        definition: dndDefinition(r.slices.map((s, i) => { const u = uploaded[i]; return Array.isArray(u) ? { cols: s.cols!.map((c, j) => ({ src: u[j].url, assetId: u[j].id, href: c.href, alt: c.alt })) } : { src: u.url, assetId: u.id, href: s.href, alt: s.alt }; }), { bg: r.footer.bg, legal: r.footer.legal, logo: logo ? { src: logo.url, assetId: logo.id, alt: client.name, href: homepage } : undefined }) } } }, tName, DND_REVISION);
  const templateId = tpl.data.id;

  // Reuse the existing draft (assign the new template to its message) instead of creating another draft.
  const prevFile = join(buildDir, "klaviyo.json");
  const prev = existsSync(prevFile) ? JSON.parse(readFileSync(prevFile, "utf8")) : null;
  if (prev?.campaign?.message_id && !NEW_CAMPAIGN && !o.include?.length && !o.exclude?.length) {
    await k.post("/campaign-message-assign-template", { data: { type: "campaign-message", id: prev.campaign.message_id, relationships: { template: { data: { type: "template", id: templateId } } } } }, "assign template (reuse draft)");
    const out = { ...prev, template_id: templateId, template_name: tName, editor: CODE ? "CODE" : "SYSTEM_DRAGGABLE", images: urls, previous_template_id: prev.template_id };
    writeFileSync(prevFile, JSON.stringify(out, null, 2));
    return { ...base, pushed: true, reusedDraft: true, klaviyo: out };
  }

  // Audiences: the ones asked for in Slack (include/exclude), else the copy doc's "Sent to" / "Excluding".
  const all = await allAudiences(db, client.id);
  const resolveNames = (ns: string[]) => ns.map((n) => { const a = pick(n, all); return { n, id: a?.id, matched: a?.name }; });
  const inc = resolveNames(o.include?.length ? o.include : meta.included), exc = resolveNames(o.exclude?.length ? o.exclude : meta.excluded);
  const missing = [...inc, ...exc].filter((x) => !x.id).map((x) => x.n);
  const out: any = { template_id: templateId, template_name: tName, images: urls, audiences: { included: inc.filter((x) => x.id).map((x) => x.matched), excluded: exc.filter((x) => x.id).map((x) => x.matched) }, missing_audiences: missing, suggestions: Object.fromEntries(missing.map((m) => [m, rank(m, all).slice(0, 4).map((r) => r.name)])) };
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
  return { ...base, pushed: true, reusedDraft: false, klaviyo: out };
}
