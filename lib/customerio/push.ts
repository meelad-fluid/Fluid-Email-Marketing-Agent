// Turns a finished design into a Customer.io DRAFT one-time send: render, slice (same slicer and link QC as
// Klaviyo), upload the slices as Customer.io file assets, then create the one-time send as a draft with the
// subject, preview, sender and audience from the copy file. Re-pushing replaces the draft's content.
// Writes only through cioDraftWriter (drafts only, per-client permission). Never sends or schedules.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dcToHtml, sliceEmail } from "../email/slicer";
import { copyMeta } from "../klaviyo/push-email";
import { cioDraftWriter, cioRead, type CioCreds } from "./api";

export type CioSegment = { id: number; name: string };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export async function cioSegments(c: CioCreds): Promise<CioSegment[]> {
  return ((await cioRead(c).get("/v1/segments")).segments ?? []).map((s: any) => ({ id: s.id, name: s.name }));
}

/** Loose match of an audience name (or id) to the client's Customer.io segments, best first. */
export function matchSegments(all: CioSegment[], q: string) {
  const t = norm(q), words = t.split(" ").filter(Boolean);
  return all.map((s) => {
    const n = norm(s.name);
    const score = String(s.id) === q.trim() || n === t ? 100 : n.includes(t) ? 85 : Math.round((words.filter((w) => n.split(" ").includes(w)).length / Math.max(words.length, 1)) * 70);
    return { ...s, score };
  }).filter((s) => s.score >= 45).sort((a, b) => b.score - a.score);
}

const cioFooter = (html: string, address: string | null) => html
  .replace("{% manage_preferences 'Manage preferences' %} | {% unsubscribe 'Unsubscribe' %}", `<a href="{% manage_subscription_preferences_url %}" style="color:inherit;text-decoration:underline">Manage preferences</a> | <a href="{% unsubscribe_url %}" style="color:inherit;text-decoration:underline">Unsubscribe</a>`)
  .replace("<p style=\"margin:0\">{{ organization.name }} · {{ organization.full_address }}</p>", address ? `<p style="margin:0">${address.replace(/[<>&]/g, "")}</p>` : "");

function businessAddress(clientDir: string): string | null {
  for (const f of ["compliance.md", "memory.md", "brand/brand-kit.md"]) {
    const p = join(clientDir, f);
    const m = existsSync(p) ? readFileSync(p, "utf8").match(/^(?:- )?\**(?:Business|Physical|Mailing)? ?address\**:\s*(.+)$/im) : null;
    if (m && m[1].trim().length > 8) return m[1].trim();
  }
  return null;
}

export async function pushToCustomerio(o: { clientsDir: string; folder: string; designRel: string; db: SupabaseClient; include?: string[]; exclude?: string[]; log?: (s: string) => void }) {
  const { folder, designRel, db } = o, log = o.log ?? (() => {});
  const clientDir = resolve(o.clientsDir, folder), designDir = resolve(clientDir, designRel), buildDir = join(designDir, "build");
  if (!designDir.startsWith(clientDir + sep)) throw new Error("Design must be inside the client folder");
  const meta = copyMeta(designDir, designRel);
  if (!meta.subject || !meta.preview) throw new Error(`Couldn't find SUBJECT (pick) / PREVIEW (pick) in the copy file (${meta.copyFile || "no Copy: line in README"})`);
  const { data: client } = await db.from("clients").select("id, name").eq("folder", folder).single();
  if (!client) throw new Error(`No client with folder ${folder}`);
  const w = await cioDraftWriter(db, client.id); // throws unless drafts are allowed and Customer.io is connected

  // Audience: the copy doc's "Sent to"/"Excluding", or the override.
  const segs = await cioSegments(w.creds);
  const resolveNames = (names: string[]) => names.map((n) => ({ asked: n, match: matchSegments(segs, n)[0] }));
  const inc = resolveNames(o.include ?? meta.included), exc = resolveNames(o.exclude ?? meta.excluded);
  const missing = [...inc, ...exc].filter((x) => !x.match).map((x) => x.asked);
  if (!inc.some((x) => x.match)) throw new Error(`No Customer.io segment matched the audience (${(o.include ?? meta.included).join(", ") || "none in the copy doc"}). Segments in this workspace: ${segs.slice(0, 25).map((s) => s.name).join(", ")}`);

  // Render, slice, QC.
  const dc = join(designDir, "design.dc.html");
  mkdirSync(buildDir, { recursive: true });
  const local = join(buildDir, "source.html");
  writeFileSync(local, existsSync(dc) ? dcToHtml(dc, clientDir) : readFileSync(join(designDir, "email.html"), "utf8"));
  const r = await sliceEmail(local, buildDir, { subject: meta.subject, preview: meta.preview });
  if (r.links.some((l) => !l.ok)) throw new Error("A link failed QC; fix it before pushing.");
  log(r.qcMd);

  // Upload slices as Customer.io assets.
  const upload = async (file: string, name: string) => {
    const fd = new FormData();
    fd.append("file", new Blob([readFileSync(join(buildDir, file))], { type: "image/jpeg" }), name);
    fd.append("name", name);
    const res = await w.write("POST", "/v1/assets/files", fd);
    return res.asset?.path as string;
  };
  const tag = `${folder}-${designRel.split("/").pop()}`.replace(/[^\w-]+/g, "-");
  const urls: (string | string[])[] = [];
  for (const s of r.slices) {
    const n = String(s.i).padStart(2, "0");
    urls.push(s.cols ? await Promise.all(s.cols.map((_, j) => upload(`slice-${n}-${j + 1}.jpg`, `${tag}-${n}-${j + 1}.jpg`))) : await upload(`slice-${n}.jpg`, `${tag}-${n}.jpg`));
  }
  const address = businessAddress(clientDir);
  const body = cioFooter(r.html(urls), address);
  writeFileSync(join(buildDir, "customerio.html"), body);

  // Sender: the copy doc's From name if it matches a verified sender.
  const senders = ((await w.read.get("/v1/sender_identities")).sender_identities ?? []) as any[];
  const sender = meta.fromLabel ? senders.find((s) => norm(s.name ?? "").includes(norm(meta.fromLabel.split(" from ")[0]))) : undefined;

  const statePath = join(buildDir, "customerio.json");
  const prev = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : null;
  const recipients = { and: [{ or: inc.filter((x) => x.match).map((x) => ({ segment: { id: x.match!.id } })) }, ...(exc.some((x) => x.match) ? [{ not: { or: exc.filter((x) => x.match).map((x) => ({ segment: { id: x.match!.id } })) } }] : [])] };
  const sameAudience = prev && JSON.stringify(prev.recipients) === JSON.stringify(recipients);
  let newsletterId: number, updated = false;
  if (prev?.newsletter_id && sameAudience) {
    // Same audience: update the existing draft's content in place.
    const n = (await w.read.get(`/v1/newsletters/${prev.newsletter_id}`).catch(() => null))?.newsletter;
    if (n && !n.sent_at && !n.scheduled_at) {
      await w.write("PUT", `/v1/newsletters/${n.id}/contents/${n.content_ids[0]}`, { subject: meta.subject, body, preheader_text: meta.preview, ...(sender ? { from_id: sender.id } : {}) });
      newsletterId = n.id; updated = true;
    }
  }
  if (!updated) {
    if (prev?.newsletter_id) await w.write("DELETE", `/v1/newsletters/${prev.newsletter_id}`).catch(() => {}); // only ever deletes our own unsent draft
    const res = await w.write("POST", "/v1/newsletters", { type: "email", name: meta.name.slice(0, 190), subject: meta.subject, preheader_text: meta.preview, body, recipients, ...(sender ? { from_id: sender.id } : {}) });
    newsletterId = res.newsletter?.id;
  }
  writeFileSync(statePath, JSON.stringify({ newsletter_id: newsletterId!, recipients, pushed_at: new Date().toISOString() }, null, 2));
  return {
    pushed: true, newsletter_id: newsletterId!, updated_existing_draft: updated, slices: r.slices.length,
    audience: inc.filter((x) => x.match).map((x) => `${x.asked} → ${x.match!.name}`), excluded: exc.filter((x) => x.match).map((x) => `${x.asked} → ${x.match!.name}`), missing_audiences: missing,
    sender: sender ? sender.name : "Customer.io default sender (no verified sender matched the copy's From name)",
    warnings: [...r.warnings, ...(address ? [] : ["No business address found (add 'Business address: …' to memory.md or compliance.md); make sure the Customer.io layout footer carries it before sending."])],
  };
}
