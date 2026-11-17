// Design review links: publish a design (new version at the same link), read and answer comments, approvals.
// One review per design folder per client. The link's token is the only key a reviewer needs.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { CLIENTS_DIR } from "./config";
import { db } from "./db";
import { dcToHtml } from "../lib/email/dc";

export const publicUrl = () => (process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 8080}`).replace(/\/+$/, "");
export const reviewLink = (token: string) => `${publicUrl()}/r/${token}`;

export type Review = { id: string; client_id: string; design_path: string; token: string; title: string; current_version: number; status: string; approved_version: number | null; approved_by: string | null; slack_channel: string | null; slack_thread: string | null };

function designDir(folder: string, designPath: string) {
  const base = join(CLIENTS_DIR, folder);
  const dir = resolve(base, designPath);
  if (!dir.startsWith(base + sep) || !/^designs\//.test(designPath.replace(/^\.\//, ""))) throw new Error("Designs live under designs/ in the client folder");
  return dir;
}

function titleOf(dir: string, fallback: string) {
  const readme = join(dir, "README.md");
  const t = existsSync(readme) ? readFileSync(readme, "utf8").match(/^# (.+?)(:\s*design)?$/m)?.[1]?.trim() : undefined;
  return t || fallback;
}

/** Render the design to HTML whose images/fonts load from this review's asset route. */
export function renderForReview(folder: string, designPath: string, token: string) {
  const dir = designDir(folder, designPath);
  const dc = join(dir, "design.dc.html");
  if (existsSync(dc)) return dcToHtml(dc, join(CLIENTS_DIR, folder), (rel) => `/r/${token}/assets/${rel.split("/").map(encodeURIComponent).join("/")}`);
  const plain = join(dir, "email.html");
  if (existsSync(plain)) return readFileSync(plain, "utf8");
  throw new Error(`No design.dc.html in ${designPath}`);
}

export async function publishDesign(o: { clientId: string; folder: string; designPath: string; note?: string; slack?: { channel: string; thread: string } }): Promise<{ url: string; version: number; review: Review }> {
  const designPath = o.designPath.replace(/^\.\//, "").replace(/\/+$/, "");
  const dir = designDir(o.folder, designPath);
  let { data: r } = await db().from("design_reviews").select("*").eq("client_id", o.clientId).eq("design_path", designPath).maybeSingle();
  if (!r) {
    const token = randomBytes(18).toString("base64url");
    const ins = await db().from("design_reviews").insert({ client_id: o.clientId, design_path: designPath, token, title: titleOf(dir, designPath.split("/").pop()!), current_version: 0, slack_channel: o.slack?.channel ?? null, slack_thread: o.slack?.thread ?? null }).select("*").single();
    if (ins.error) throw ins.error;
    r = ins.data;
  }
  const html = renderForReview(o.folder, designPath, r!.token);
  const { data: last } = await db().from("design_review_versions").select("version, html").eq("review_id", r!.id).order("version", { ascending: false }).limit(1).maybeSingle();
  let version = last?.version ?? 0;
  if (!last || last.html !== html) {
    version += 1;
    const v = await db().from("design_review_versions").insert({ review_id: r!.id, version, html, note: o.note ?? null });
    if (v.error) throw v.error;
  }
  const upd = await db().from("design_reviews").update({
    current_version: version, title: titleOf(dir, r!.title), updated_at: new Date().toISOString(),
    ...(o.slack && !r!.slack_channel ? { slack_channel: o.slack.channel, slack_thread: o.slack.thread } : {}),
    ...(r!.status === "approved" && version !== r!.approved_version ? { status: "in_review" } : {}),
  }).eq("id", r!.id).select("*").single();
  if (upd.error) throw upd.error;
  // Keep the link in the design's README so anyone (and the bot) can find it.
  const readme = join(dir, "README.md");
  if (existsSync(readme)) {
    const s = readFileSync(readme, "utf8");
    const line = `Review link: ${reviewLink(r!.token)}`;
    writeFileSync(readme, /^Review link: .*$/m.test(s) ? s.replace(/^Review link: .*$/m, line) : s.replace(/^(# .+\n)/, `$1${line}\n`));
  }
  return { url: reviewLink(r!.token), version, review: upd.data as Review };
}

export async function reviewByPath(clientId: string, designPath: string) {
  const { data } = await db().from("design_reviews").select("*").eq("client_id", clientId).eq("design_path", designPath.replace(/^\.\//, "").replace(/\/+$/, "")).maybeSingle();
  return data as Review | null;
}

export async function openComments(reviewId: string, currentVersion: number) {
  const { data } = await db().from("review_comments").select("id, version, parent_id, x, y, body, author_name, author_kind, resolved, created_at").eq("review_id", reviewId).order("created_at");
  const all = data ?? [];
  // To do = top-level comments Fluid hasn't answered yet. Reviewers sometimes click Resolve on their own
  // comment to mean "done writing", so resolved-but-unanswered comments on the current version still count;
  // resolved comments from older versions are treated as settled.
  const answered = new Set(all.filter((x) => x.parent_id && x.author_kind === "bot").map((x) => x.parent_id));
  return all.filter((c) => !c.parent_id && !answered.has(c.id) && (!c.resolved || c.version >= currentVersion))
    .map((c) => ({ ...c, replies: all.filter((x) => x.parent_id === c.id).map((x) => ({ author: x.author_name, kind: x.author_kind, body: x.body })) }));
}

export async function replyToComment(reviewId: string, commentId: string, text: string, resolve: boolean) {
  const { data: c } = await db().from("review_comments").select("id, version").eq("id", commentId).eq("review_id", reviewId).maybeSingle();
  if (!c) throw new Error("Comment not found on this design");
  const ins = await db().from("review_comments").insert({ review_id: reviewId, version: c.version, parent_id: c.id, body: text.slice(0, 4000), author_name: "Fluid", author_kind: "bot" });
  if (ins.error) throw ins.error;
  if (resolve) await db().from("review_comments").update({ resolved: true }).eq("id", c.id);
}
