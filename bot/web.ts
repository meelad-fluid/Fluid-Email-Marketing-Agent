// Review pages, served by the bot process (Railway gives it a public URL; set PUBLIC_URL to it).
//   GET  /r/:token              the review page (email at full quality, pinned comments, approve)
//   GET  /r/:token/frame?v=N    the email itself (version N, default latest)
//   GET  /r/:token/assets/...   images/fonts from that client's folder only
//   GET  /r/:token/data         review state as JSON
//   POST /r/:token/comments     {version, x?, y?, body, author, parent_id?}
//   POST /r/:token/resolve      {comment_id, resolved}
//   POST /r/:token/approve      {author}
// A link's token only ever opens its own design. Nothing here can send email or touch Klaviyo.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { CLIENTS_DIR } from "./config";
import { db } from "./db";
import { saveClientFolder } from "./git";
import { reviewLink, type Review } from "./review";
import { formLink, formSections, hasExistingForm, MAX_UPLOAD, saveForm, saveInternalForm, saveUpload } from "./onboarding";
import { marked } from "marked";

type Notify = (channel: string, thread: string | null, text: string) => Promise<void>;
const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf" };
const hits = new Map<string, number[]>();

// ── Approval updates: people approve several emails in a row, so collect them for a minute and post one
// teammate-style line ("Nick approved the welcome flow") instead of one log line per email.
type Approval = { channel: string; thread: string | null; clientId: string; title: string; author: string };
const pendingApprovals = new Map<string, { items: Approval[]; timer: ReturnType<typeof setTimeout> }>();
export function queueApproval(notify: Notify, a: Approval) {
  const p = pendingApprovals.get(a.channel) ?? { items: [], timer: setTimeout(() => {}, 0) };
  clearTimeout(p.timer);
  p.items.push(a);
  p.timer = setTimeout(() => { pendingApprovals.delete(a.channel); approvalMessage(p.items).then((t) => notify(a.channel, null, t)).catch((e) => console.error("[approvals]", e.message)); }, 60_000);
  pendingApprovals.set(a.channel, p);
}
const flowOf = (title: string) => {
  const m = title.match(/^(.+?)\s+(?:email|sms)\s*#\s*(\d+)/i);
  return m ? { flow: m[1].trim(), n: Number(m[2]) } : null;
};
const andList = (xs: string[]) => xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
export async function approvalMessage(items: Approval[]): Promise<string> {
  const people = andList([...new Set(items.map((i) => i.author.split(" ")[0]))]);
  const { data: all } = await db().from("design_reviews").select("title, status").eq("client_id", items[0].clientId);
  const parts: string[] = [];
  const flows = new Map<string, Set<number>>();
  const waiting: string[] = [];
  for (const i of items) { const f = flowOf(i.title); if (f) flows.set(f.flow, (flows.get(f.flow) ?? new Set()).add(f.n)); else parts.push(`the ${i.title.split(/\s+[—–-]\s+/)[0]} email`); }
  for (const [flow, nums] of flows) {
    const inFlow = (all ?? []).filter((d) => flowOf(d.title)?.flow.toLowerCase() === flow.toLowerCase());
    const allApproved = inFlow.length > 1 && inFlow.every((d) => d.status === "approved");
    const name = flow.toLowerCase().includes("flow") ? flow.toLowerCase() : `${flow.toLowerCase()} flow`;
    const sorted = [...nums].sort((a, b) => a - b);
    const range = sorted.length > 2 && sorted[sorted.length - 1] - sorted[0] === sorted.length - 1 ? [`#${sorted[0]}–${sorted[sorted.length - 1]}`] : sorted.map((n) => `#${n}`);
    parts.push(allApproved ? `the whole ${name}` : `${flow.toLowerCase()} ${nums.size > 1 ? "emails" : "email"} ${andList(range)}`);
    const left = inFlow.filter((d) => d.status !== "approved").map((d) => d.title.split(/\s+[—–-]\s+/)[0].replace(/\s+email\s+/i, " "));
    if (!allApproved && left.length && left.length <= 2) waiting.push(`${andList(left)} ${left.length > 1 ? "are" : "is"} still waiting`);
  }
  const whole = parts.some((p) => p.startsWith("the whole"));
  return `${people} approved ${andList([...new Set(parts)])}${whole ? ", so it's ready to build." : "."}${waiting.length ? ` ${waiting.join(". ").replace(/^./, (c) => c.toUpperCase())}.` : ""}`;
}
const limited = (ip: string) => { const now = Date.now(); const h = (hits.get(ip) ?? []).filter((t) => now - t < 600_000); h.push(now); hits.set(ip, h); return h.length > 40; };

async function body(req: IncomingMessage): Promise<any> {
  let raw = "";
  for await (const c of req) { raw += c; if (raw.length > 20_000) throw new Error("too large"); }
  return raw ? JSON.parse(raw) : {};
}
const send = (res: ServerResponse, code: number, data: string | Buffer, type = "text/plain; charset=utf-8", extra: Record<string, string> = {}) => {
  res.writeHead(code, { "content-type": type, "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff", ...extra });
  res.end(data);
};
const json = (res: ServerResponse, code: number, o: unknown) => send(res, code, JSON.stringify(o), "application/json");

async function load(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const { data } = await db().from("design_reviews").select("*, clients(name, folder)").eq("token", token).maybeSingle();
  return data as (Review & { clients: { name: string; folder: string } }) | null;
}

export function startWeb(notify: Notify, onFormSubmitted: (r: { clientId: string; folder: string; name: string; klaviyo: string; internal?: boolean }) => void = () => {}) {
  const port = Number(process.env.PORT || 8080);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://x");
      const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "").split(",")[0].trim();
      if (url.pathname === "/health") return send(res, 200, "ok");

      // ── Client onboarding form ──
      const ob = url.pathname.match(/^\/onboard\/([A-Za-z0-9_-]+)(\/submit|\/upload)?$/);
      if (ob) {
        const l = await formLink(ob[1]);
        if (!l) return send(res, 404, "This onboarding link has expired or was already used. Ask your Fluid contact for a new one.");
        const internal = l.kind === "internal";
        if (req.method === "GET" && !ob[2]) return send(res, 200, internal ? internalPage(l.clients.name) : formPage(l.clients.name, hasExistingForm(l.clients.folder)), "text/html; charset=utf-8", { "cache-control": "no-store" });
        if (req.method === "POST" && ob[2] === "/upload" && internal) {
          if (limited(ip)) return json(res, 429, { error: "Too many uploads, wait a few minutes." });
          const chunks: Buffer[] = []; let n = 0;
          for await (const c of req) { n += c.length; if (n > MAX_UPLOAD) return json(res, 413, { error: "That file is too big (30 MB max)." }); chunks.push(c as Buffer); }
          try { return json(res, 200, { ok: true, name: await saveUpload(ob[1], String(url.searchParams.get("name") ?? "file"), Buffer.concat(chunks)) }); }
          catch (e: any) { return json(res, 400, { error: e.message }); }
        }
        if (req.method === "POST" && ob[2] === "/submit") {
          if (limited(ip)) return json(res, 429, { error: "Too many tries, wait a few minutes." });
          let raw = ""; for await (const c of req) { raw += c; if (raw.length > 200_000) return json(res, 413, { error: "Too long" }); }
          const b = JSON.parse(raw || "{}");
          try { const r = internal ? await saveInternalForm(ob[1], b.answers ?? {}, b.klaviyo_key) : await saveForm(ob[1], b.answers ?? {}, b.klaviyo_key); onFormSubmitted(r); return json(res, 200, { ok: true }); }
          catch (e: any) { return json(res, 400, { error: e.message }); }
        }
      }

      // ── Shared documents (onboarding doc, plans) ──
      const dm = url.pathname.match(/^\/d\/([A-Za-z0-9_-]{16,64})$/);
      if (dm && req.method === "GET") {
        const { data: d } = await db().from("doc_links").select("path, title, clients(name, folder)").eq("token", dm[1]).maybeSingle();
        if (!d) return send(res, 404, "Not found");
        const c: any = (d as any).clients;
        const base = join(CLIENTS_DIR, c.folder), file = resolve(base, d.path);
        if (!file.startsWith(base + sep) || !existsSync(file)) return send(res, 404, "This document isn't available.");
        return send(res, 200, docPage(d.title, c.name, marked.parse(readFileSync(file, "utf8")) as string), "text/html; charset=utf-8", { "cache-control": "no-store" });
      }

      const m = url.pathname.match(/^\/r\/([A-Za-z0-9_-]+)(\/.*)?$/);
      if (!m) return send(res, 404, "Not found");
      const r = await load(m[1]);
      if (!r) return send(res, 404, "This review link doesn't exist or has been removed.");
      const sub = m[2] ?? "";

      if (req.method === "GET" && sub === "") return send(res, 200, PAGE, "text/html; charset=utf-8", { "cache-control": "no-store" });
      if (req.method === "GET" && sub === "/frame") {
        const v = Number(url.searchParams.get("v")) || r.current_version;
        const { data } = await db().from("design_review_versions").select("html").eq("review_id", r.id).eq("version", v).maybeSingle();
        if (!data) return send(res, 404, "Version not found");
        return send(res, 200, data.html.replace("<head>", '<head><base target="_blank">'), "text/html; charset=utf-8", { "cache-control": "no-store" });
      }
      if (req.method === "GET" && sub.startsWith("/assets/")) {
        const base = join(CLIENTS_DIR, r.clients.folder);
        const file = resolve(base, decodeURIComponent(sub.slice("/assets/".length)));
        const type = TYPES[extname(file).toLowerCase()];
        if (!file.startsWith(base + sep) || !type || !existsSync(file) || !statSync(file).isFile()) return send(res, 404, "Not found");
        return send(res, 200, readFileSync(file), type, { "cache-control": "public, max-age=86400" });
      }
      if (req.method === "GET" && sub === "/data") {
        const [{ data: versions }, { data: comments }] = await Promise.all([
          db().from("design_review_versions").select("version, note, created_at").eq("review_id", r.id).order("version"),
          db().from("review_comments").select("id, version, parent_id, x, y, body, author_name, author_kind, resolved, created_at").eq("review_id", r.id).order("created_at"),
        ]);
        return json(res, 200, { title: r.title, client: r.clients.name, current: r.current_version, status: r.status, approved_version: r.approved_version, approved_by: r.approved_by, versions, comments });
      }
      if (req.method === "POST") {
        if (limited(ip)) return json(res, 429, { error: "Too many requests, try again in a few minutes." });
        const b = await body(req);
        const author = String(b.author ?? "").trim().slice(0, 80);
        if (!author) return json(res, 400, { error: "Add your name first." });
        if (sub === "/comments") {
          const text = String(b.body ?? "").trim().slice(0, 4000);
          if (!text) return json(res, 400, { error: "Write a comment first." });
          const parent = b.parent_id ? String(b.parent_id) : null;
          if (parent) {
            const { data: p } = await db().from("review_comments").select("id").eq("id", parent).eq("review_id", r.id).maybeSingle();
            if (!p) return json(res, 400, { error: "That comment is gone." });
          }
          const ins = await db().from("review_comments").insert({ review_id: r.id, version: Number(b.version) || r.current_version, parent_id: parent, x: parent ? null : Number(b.x), y: parent ? null : Number(b.y), body: text, author_name: author, author_kind: "reviewer" }).select("id").single();
          if (ins.error) return json(res, 500, { error: "Couldn't save the comment." });
          return json(res, 200, { ok: true, id: ins.data.id });
        }
        if (sub === "/resolve") {
          await db().from("review_comments").update({ resolved: !!b.resolved }).eq("id", String(b.comment_id)).eq("review_id", r.id);
          return json(res, 200, { ok: true });
        }
        if (sub === "/approve") {
          const now = new Date();
          await db().from("design_reviews").update({ status: "approved", approved_version: r.current_version, approved_by: author, approved_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", r.id);
          // Record it in the design's README (the bot reads the Status line) and save to GitHub.
          const readme = join(CLIENTS_DIR, r.clients.folder, r.design_path, "README.md");
          if (existsSync(readme)) {
            const s = readFileSync(readme, "utf8");
            const live = s.match(/^Status: .*?(goes live .*)$/m)?.[1];
            const line = `Status: approved by ${author} on ${now.toISOString().slice(0, 10)} (v${r.current_version})${live ? ` · ${live}` : ""}`;
            writeFileSync(readme, /^Status: .*$/m.test(s) ? s.replace(/^Status: .*$/m, line) : s.replace(/^(# .+\n)/, `$1${line}\n`));
            saveClientFolder(r.clients.folder, `${r.clients.folder}: ${r.title} approved by ${author} (v${r.current_version}, via review link)`).catch(() => {});
          }
          if (r.slack_channel) queueApproval(notify, { channel: r.slack_channel, thread: r.slack_thread, clientId: (r as any).client_id, title: r.title, author });
          return json(res, 200, { ok: true });
        }
      }
      return send(res, 404, "Not found");
    } catch (e: any) {
      console.error("[web]", e.message);
      return json(res, 500, { error: "Something went wrong." });
    }
  });
  server.listen(port, () => console.log(`Review pages on port ${port} (public: ${process.env.PUBLIC_URL || "set PUBLIC_URL"})`));
}

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Design review</title>
<style>
:root{--bg:#f4f2ee;--panel:#fff;--ink:#1d1d1d;--muted:#6b6b6b;--line:#e4e0d8;--accent:#E03400;--ok:#1a7f37}
*{box-sizing:border-box}html,body{overflow-x:hidden}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
header{position:sticky;top:0;z-index:5;background:var(--panel);border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:10px 16px}
header h1{font-size:16px;margin:0;flex:1 1 220px}header small{color:var(--muted);font-weight:400;display:block}
.pill{border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600}.pill.review{background:#fff3e0;color:#9a4b00}.pill.ok{background:#e7f6ec;color:var(--ok)}
button,select{font:inherit;border:1px solid var(--line);background:#fff;border-radius:8px;padding:7px 12px;cursor:pointer;min-height:36px}
button.primary{background:var(--accent);border-color:var(--accent);color:#fff}button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
main{display:flex;flex-wrap:wrap;gap:20px;padding:20px 16px;justify-content:center;align-items:flex-start}
.stage{position:relative;flex:0 0 auto}.stage iframe{display:block;border:0;width:600px;background:#fff;box-shadow:0 2px 20px rgba(0,0,0,.08)}
.overlay{position:absolute;inset:0;cursor:crosshair;display:none}.commenting .overlay{display:block}
.pin{position:absolute;width:28px;height:28px;margin:-28px 0 0 0;border-radius:50% 50% 50% 0;background:var(--accent);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer;z-index:2}
.pin.done{background:#9b9b9b}.pin.sel{outline:3px solid #1d1d1d}
aside{flex:1 1 320px;max-width:420px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px}
aside h2{font-size:14px;margin:0 0 10px}.c{border-top:1px solid var(--line);padding:10px 0}.c.sel{background:#fff8f3}
.c .who{font-weight:600;font-size:13px}.c .who em{font-style:normal;color:var(--muted);font-weight:400}.c p{margin:4px 0;white-space:pre-wrap;word-wrap:break-word}
.r{margin:6px 0 0 14px;padding-left:10px;border-left:2px solid var(--line)}.r.bot .who{color:var(--accent)}
.row{display:flex;gap:6px;margin-top:6px}textarea{font:inherit;width:100%;border:1px solid var(--line);border-radius:8px;padding:8px;min-height:60px;resize:vertical}
.hint{color:var(--muted);font-size:13px}
#fit{flex:0 0 auto;max-width:100%;overflow:hidden}.stage{transform-origin:top left;width:600px}
#composer{position:absolute;z-index:20;width:280px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px;box-shadow:0 8px 30px rgba(0,0,0,.18);display:none}#composer textarea{font-size:16px}#chint{display:none;margin-bottom:6px}.pin.pending{background:#1d1d1d}
@media (max-width:700px){#composer{position:fixed;left:0;right:0;bottom:0;top:auto!important;width:auto;border-radius:16px 16px 0 0;padding:14px max(16px,env(safe-area-inset-left)) calc(14px + env(safe-area-inset-bottom));box-shadow:0 -8px 30px rgba(0,0,0,.2)}#chint{display:block}}
@media (max-width:700px){main{padding:12px 8px}aside{max-width:none}}
</style></head><body>
<header><h1 id="t">Loading…<small id="sub"></small></h1>
<span id="status" class="pill review"></span>
<select id="ver" aria-label="Version"></select>
<button id="view">Mobile view</button>
<button id="cm" class="on">Comment</button>
<button id="ap" class="primary">Approve</button></header>
<main id="main"><div id="fit"><div class="stage" id="stage"><iframe id="f" title="Email design" scrolling="no"></iframe><div class="overlay" id="ov"></div></div></div>
<div id="composer"><div class="hint" id="chint">Comment on the marked spot</div><textarea id="ctext" placeholder="What should change here?"></textarea><div class="row"><button class="primary" id="csave">Comment</button><button id="ccancel">Cancel</button></div></div>
<aside><h2>Comments</h2><div class="hint" id="hint">Click anywhere on the email to leave a comment. Turn "Comment" off to click the email's links.</div><div id="list"></div></aside></main>
<script>
const token=location.pathname.split("/")[2];let S=null,ver=null,sel=null,pending=null;
const $=(id)=>document.getElementById(id);
const esc=(s)=>String(s).replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function who(){let n=localStorage.getItem("fluid-review-name");if(!n){n=(prompt("Your name (shown next to your comments):")||"").trim();if(n)localStorage.setItem("fluid-review-name",n)}return n}
async function api(p,b){const r=await fetch("/r/"+token+p,b?{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}:{});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"Something went wrong");return j}
async function load(keep){S=await api("/data");if(!keep||ver===null)ver=S.current;$("t").firstChild.nodeValue=S.title;$("sub").textContent=S.client+" · design review";
const ok=S.status==="approved"&&S.approved_version===S.current;$("status").className="pill "+(ok?"ok":"review");$("status").textContent=ok?"Approved by "+S.approved_by:"Waiting for approval";$("ap").disabled=ok;
$("ver").innerHTML=S.versions.map(v=>'<option value="'+v.version+'"'+(v.version===ver?" selected":"")+">Version "+v.version+(v.version===S.current?" (latest)":"")+"</option>").join("");render()}
let H=0,mobile=false;
function fit(){const avail=Math.min(document.documentElement.clientWidth-16,mobile?375:600),k=Math.min(1,avail/600);$("stage").style.transform="scale("+k+")";$("fit").style.width=600*k+"px";$("fit").style.height=H*k+"px"}
function frame(){const f=$("f");f.onload=()=>{H=f.contentDocument.documentElement.scrollHeight;f.style.height=H+"px";$("ov").style.height=H+"px";fit();pins()};f.src="/r/"+token+"/frame?v="+ver}
let lastW=document.documentElement.clientWidth;addEventListener("resize",()=>{const w=document.documentElement.clientWidth;if(w!==lastW){lastW=w;fit()}});
function tops(){return S.comments.filter(c=>!c.parent_id&&c.version===ver)}
function pins(){document.querySelectorAll(".pin:not(.pending)").forEach(p=>p.remove());tops().forEach((c,i)=>{const p=document.createElement("div");p.className="pin"+(c.resolved?" done":"")+(sel===c.id?" sel":"");p.style.left=c.x+"px";p.style.top=c.y+"px";p.textContent=i+1;p.onclick=(e)=>{e.stopPropagation();sel=c.id;render()};$("stage").appendChild(p)})}
function render(){pins();const list=tops();$("list").innerHTML=list.length?list.map((c,i)=>{const rs=S.comments.filter(x=>x.parent_id===c.id);return '<div class="c'+(sel===c.id?" sel":"")+'" data-id="'+c.id+'"><div class="who">'+(i+1)+". "+esc(c.author_name)+(c.resolved?" <em>· resolved</em>":"")+'</div><p>'+esc(c.body)+"</p>"+rs.map(r=>'<div class="r'+(r.author_kind==="bot"?" bot":"")+'"><div class="who">'+esc(r.author_kind==="bot"?"Fluid":r.author_name)+"</div><p>"+esc(r.body)+"</p></div>").join("")+'<div class="row"><button data-reply="'+c.id+'">Reply</button><button data-res="'+c.id+'">'+(c.resolved?"Reopen":"Resolve")+"</button></div></div>"}).join(""):'<p class="hint">No comments on this version yet.</p>';}
$("list").onclick=async(e)=>{const id=e.target.dataset.reply,rid=e.target.dataset.res;if(id){const n=who();if(!n)return;const t=(prompt("Your reply:")||"").trim();if(!t)return;await api("/comments",{author:n,body:t,parent_id:id,version:ver}).catch(a=>alert(a.message));await load(true)}if(rid){const c=S.comments.find(x=>x.id===rid);await api("/resolve",{author:who()||"Reviewer",comment_id:rid,resolved:!c.resolved});await load(true)}const box=e.target.closest(".c");if(box&&!id&&!rid){sel=box.dataset.id;render()}};
function clearPending(){const p=document.querySelector(".pin.pending");if(p)p.remove();$("composer").style.display="none";pending=null}
$("ov").onclick=(e)=>{const r=$("ov").getBoundingClientRect(),k=600/r.width;pending={x:Math.round((e.clientX-r.left)*k),y:Math.round((e.clientY-r.top)*k)};
const old=document.querySelector(".pin.pending");if(old)old.remove();const pp=document.createElement("div");pp.className="pin pending";pp.style.left=pending.x+"px";pp.style.top=pending.y+"px";pp.textContent="+";$("stage").appendChild(pp);
const c=$("composer"),narrow=matchMedia("(max-width:700px)").matches;c.style.display="block";$("ctext").value="";
if(!narrow){c.style.left=Math.max(8,Math.min(e.pageX-140,document.documentElement.clientWidth-296))+"px";c.style.top=(e.pageY+18)+"px"}
$("ctext").focus({preventScroll:true})};
$("ccancel").onclick=clearPending;
$("csave").onclick=async()=>{const n=who();if(!n||!pending)return;const t=$("ctext").value.trim();if(!t)return;try{await api("/comments",{author:n,body:t,x:pending.x,y:pending.y,version:ver});clearPending();await load(true)}catch(a){alert(a.message)}};
$("cm").onclick=()=>{$("main").classList.toggle("commenting");$("cm").classList.toggle("on")};$("main").classList.add("commenting");
$("view").onclick=()=>{mobile=!mobile;$("view").textContent=mobile?"Desktop view":"Mobile view";fit()};
$("ver").onchange=()=>{ver=Number($("ver").value);sel=null;frame();render()};
$("ap").onclick=async()=>{const n=who();if(!n)return;if(!confirm("Approve version "+S.current+" of this email as it is now?"))return;await api("/approve",{author:n}).catch(a=>alert(a.message));await load(true)};
load().then(frame).catch(e=>{document.body.innerHTML="<p style='padding:24px'>"+esc(e.message)+"</p>"});
setInterval(()=>load(true).catch(()=>{}),30000);
</script></body></html>`;

const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const BASE_CSS = `:root{--ink:#1d1d1d;--muted:#666;--line:#e4e0d8;--accent:#E03400}*{box-sizing:border-box}html,body{overflow-x:hidden}body{margin:0;background:#f6f4ef;color:var(--ink);font:18px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}.wrap{max-width:980px;margin:0 auto;padding:40px 20px 80px}h1{font-size:36px;line-height:1.15;margin:0 0 10px}.sub{color:var(--muted);margin:0 0 32px;font-size:19px}`;

export function docPage(title: string, client: string, html: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(title)}</title>
<style>${BASE_CSS}.doc{background:#fff;border:1px solid var(--line);border-radius:12px;padding:28px 28px 36px}.doc h1{font-size:26px}.doc h2{font-size:20px;margin:28px 0 8px;padding-top:16px;border-top:1px solid var(--line)}.doc h3{font-size:17px;margin:20px 0 6px}.doc table{border-collapse:collapse;width:100%;display:block;overflow-x:auto;font-size:14px}.doc th,.doc td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}.doc th{background:#faf8f4}.doc pre{white-space:pre-wrap;background:#faf8f4;border:1px solid var(--line);border-radius:8px;padding:12px;font-size:13.5px}.doc code{font-size:13.5px}.doc blockquote{margin:0;padding-left:12px;border-left:3px solid var(--line);color:var(--muted)}@media(max-width:600px){.doc{padding:18px}}</style></head>
<body><div class="wrap"><p class="sub">${esc(client)} · prepared by Fluid Creatives</p><div class="doc">${html}</div></div></body></html>`;
}

export function formPage(client: string, keyOnly = false) {
  const field = (q: any) => {
    const req = q.required ? " required" : "";
    const label = `<label for="${q.id}">${esc(q.label)}${q.required ? ' <span class="req">*</span>' : ""}</label>${q.help ? `<div class="help">${esc(q.help)}</div>` : ""}`;
    if (q.type === "connection") return `<div class="q">${label.replace(`for="${q.id}"`, 'for="klaviyo_key"')}<div class="help">Klaviyo → Settings → API keys → Create Private API Key → choose <b>Read-only access</b> for everything (Full access only if you've agreed Fluid will build drafts and segments for you). Paste it here: it's stored encrypted and only used by Fluid's systems.</div><input id="klaviyo_key" name="klaviyo_key" type="password" autocomplete="off" placeholder="pk_…"></div>`;
    if (q.type === "textarea" || q.type === "list") return `<div class="q">${label}<textarea id="${q.id}" name="${q.id}" rows="${q.type === "list" ? 4 : 3}"${req} placeholder="${esc(q.placeholder ?? (q.type === "list" ? "One per line" : ""))}"></textarea></div>`;
    if (q.type === "choice") return `<div class="q">${label}<select id="${q.id}" name="${q.id}"${req}><option value="">Choose…</option>${(q.options ?? []).map((o: string) => `<option>${esc(o)}</option>`).join("")}</select></div>`;
    const type = q.type === "url" ? "url" : q.type === "email" ? "email" : q.type === "number" || q.type === "percent" ? "number" : "text";
    return `<div class="q">${label}<input id="${q.id}" name="${q.id}" type="${type}"${req} placeholder="${esc(q.placeholder ?? "")}"></div>`;
  };
  const keyQ = formSections().flatMap((x) => x.questions).find((q) => q.type === "connection");
  const sections = keyOnly
    ? `<section><h2>Connect Klaviyo</h2><p class="help">We already have your onboarding answers, so this is all we need: a Klaviyo key, so we can review your flows, campaigns and results.</p>${keyQ ? field(keyQ) : ""}<div class="q"><label for="notes">Anything new since your onboarding form? (optional)</label><textarea id="notes" name="notes" rows="3" placeholder="New products, offers, dates…"></textarea></div></section>`
    : formSections().map((s) => `<section><h2>${esc(s.title)}</h2>${s.intro ? `<p class="help">${esc(s.intro)}</p>` : ""}${s.questions.map(field).join("")}</section>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(client)} onboarding</title>
<style>${BASE_CSS}section{background:#fff;border:1px solid var(--line);border-radius:14px;padding:32px 36px;margin-bottom:20px}h2{font-size:24px;margin:0 0 6px}.q{margin-top:24px}label{display:block;font-weight:650;font-size:18px}.req{color:var(--accent)}.help{color:var(--muted);font-size:16px;margin:4px 0 8px}input,textarea,select{width:100%;font:inherit;font-size:18px;border:1px solid #d9d4ca;border-radius:10px;padding:14px 16px;background:#fff;min-height:54px}textarea{min-height:120px}button{font:inherit;font-weight:650;font-size:19px;background:var(--accent);color:#fff;border:0;border-radius:10px;padding:18px 24px;min-height:60px;cursor:pointer;width:100%}#msg{margin-top:14px;font-weight:600}@media(max-width:600px){section{padding:22px 18px}h1{font-size:28px}}</style></head>
<body><div class="wrap"><h1>${esc(client)} × Fluid Creatives</h1><p class="sub">${keyOnly ? "One last step to finish your onboarding." : "Tell us about your brand. It takes about 15 minutes, and it's what everything we write and design for you is built on."}</p>
<form id="f">${sections}<button type="submit" id="go">${keyOnly ? "Connect Klaviyo" : "Send to Fluid"}</button><div id="msg"></div></form></div>
<script>
const f=document.getElementById("f"),msg=document.getElementById("msg"),go=document.getElementById("go");
f.onsubmit=async(e)=>{e.preventDefault();go.disabled=true;msg.textContent="Sending…";const a={};for(const el of f.elements){if(!el.name||el.name==="klaviyo_key")continue;a[el.name]=el.value}
try{const r=await fetch(location.pathname+"/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({answers:a,klaviyo_key:f.elements.klaviyo_key?f.elements.klaviyo_key.value:""})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Something went wrong");f.innerHTML="<section><h2>Thank you!</h2><p>We've got everything. Your Fluid team will be in touch with your onboarding doc and first campaigns shortly.</p></section>"}catch(err){msg.textContent=err.message;go.disabled=false}};
</script></body></html>`;
}

/** Internal onboarding page (Fluid team only): the client's onboarding doc (PDF) + optional Klaviyo / Customer.io key. */
export function internalPage(client: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(client)} onboarding</title>
<style>${BASE_CSS}section{background:#fff;border:1px solid var(--line);border-radius:14px;padding:32px 36px;margin-bottom:20px}h2{font-size:24px;margin:0 0 6px}.q{margin-top:22px}label{display:block;font-weight:650;font-size:18px}.help{color:var(--muted);font-size:16px;margin:4px 0 8px}input[type=password],textarea{width:100%;font:inherit;font-size:18px;border:1px solid #d9d4ca;border-radius:10px;padding:14px 16px;background:#fff;min-height:54px}textarea{min-height:110px}
.drop{border:2px dashed #cfc8bb;border-radius:12px;padding:34px 18px;text-align:center;cursor:pointer;color:var(--muted)}.drop.over{border-color:var(--accent);background:#fff6f2}.drop b{color:var(--ink);font-size:19px}#files{list-style:none;padding:0;margin:10px 0 0}#files li{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:16px}#files li span:last-child{color:var(--muted);white-space:nowrap}
.seg{display:flex;flex-wrap:wrap;gap:8px}.seg label{font-weight:600;font-size:17px;border:1px solid #d9d4ca;border-radius:999px;padding:10px 18px;cursor:pointer}.seg input{position:absolute;opacity:0}.seg input:checked+span{color:#fff}.seg label:has(input:checked){background:var(--ink);border-color:var(--ink);color:#fff}.seg input:focus-visible+span{outline:2px solid var(--accent);outline-offset:4px}
button{font:inherit;font-weight:650;font-size:19px;background:var(--accent);color:#fff;border:0;border-radius:10px;padding:18px 24px;min-height:60px;cursor:pointer;width:100%}#msg{margin-top:14px;font-weight:600}.tag{display:inline-block;background:#1d1d1d;color:#fff;border-radius:999px;font-size:13px;padding:3px 10px;margin-bottom:12px}@media(max-width:600px){section{padding:22px 18px}h1{font-size:28px}}</style></head>
<body><div class="wrap"><span class="tag">Fluid team only</span><h1>Onboard ${esc(client)}</h1><p class="sub">Upload the client's onboarding doc. The onboarding runs in their Slack channel as soon as you save.</p>
<form id="f"><section><h2>Onboarding doc</h2><p class="help">The PDF with their onboarding answers. Add brand guidelines or other files too if you have them (PDF, images, Word, PowerPoint; up to 30 MB each).</p>
<div class="drop" id="drop"><b>Drop the PDF here</b><br>or click to choose<input id="pick" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.pptx,.txt,.md" hidden></div><ul id="files"></ul></section>
<section><h2>Email platform <span style="font-weight:400;color:var(--muted);font-size:17px">(optional)</span></h2><p class="help">Connect it now or later. Without a key, the onboarding works from the doc and their website.</p>
<div class="seg" role="radiogroup" aria-label="Email platform"><label><input type="radio" name="platform" value="klaviyo" id="p-k"><span>Klaviyo</span></label><label><input type="radio" name="platform" value="customerio" id="p-c"><span>Customer.io</span></label><label><input type="radio" name="platform" value="none" id="p-n" checked><span>Not now</span></label></div>
<div class="q" id="keybox" hidden><label for="key" id="keylabel">API key</label><div class="help" id="keyhelp"></div><input id="key" type="password" autocomplete="off"></div></section>
<section><h2>Notes <span style="font-weight:400;color:var(--muted);font-size:17px">(optional)</span></h2><div class="q" style="margin-top:6px"><textarea id="notes" name="notes" placeholder="Anything the doc doesn't say: current offers, sender name, what to avoid…"></textarea></div></section>
<button type="submit" id="go">Save and start onboarding</button><div id="msg"></div></form></div>
<script>
const f=document.getElementById("f"),msg=document.getElementById("msg"),go=document.getElementById("go"),drop=document.getElementById("drop"),pick=document.getElementById("pick"),list=document.getElementById("files");let queue=[];
const HELP={klaviyo:["Klaviyo private API key","Klaviyo → Settings → API keys → Create Private API Key. Read-only is enough for the audit; Full access if we'll build drafts. Starts with pk_.","pk_…"],customerio:["Customer.io App API key","Customer.io → Settings → API Credentials → App API Keys → Create. Stored encrypted; we only create drafts, never send.",""]};
for(const r of f.elements.platform){r.onchange=()=>{const p=f.elements.platform.value,h=HELP[p];document.getElementById("keybox").hidden=!h;if(h){document.getElementById("keylabel").textContent=h[0];document.getElementById("keyhelp").textContent=h[1];document.getElementById("key").placeholder=h[2]}}}
const kb=(n)=>n>1048576?(n/1048576).toFixed(1)+" MB":Math.ceil(n/1024)+" KB";
function add(fs){for(const x of fs){if(x.size>30*1048576){msg.textContent=x.name+" is over 30 MB";continue}queue.push(x)}show()}
function show(){list.innerHTML=queue.map((x,i)=>"<li><span>"+x.name.replace(/</g,"&lt;")+"</span><span id='s"+i+"'>"+kb(x.size)+"</span></li>").join("")}
drop.onclick=()=>pick.click();pick.onchange=()=>add(pick.files);
drop.ondragover=(e)=>{e.preventDefault();drop.classList.add("over")};drop.ondragleave=()=>drop.classList.remove("over");drop.ondrop=(e)=>{e.preventDefault();drop.classList.remove("over");add(e.dataTransfer.files)};
f.onsubmit=async(e)=>{e.preventDefault();if(!queue.length){msg.textContent="Add the onboarding doc first.";return}go.disabled=true;
try{for(let i=0;i<queue.length;i++){const x=queue[i];if(x.done)continue;document.getElementById("s"+i).textContent="Uploading…";msg.textContent="Uploading "+(i+1)+" of "+queue.length+"…";
const r=await fetch(location.pathname+"/upload?name="+encodeURIComponent(x.name),{method:"POST",body:x});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"Upload failed");x.done=true;document.getElementById("s"+i).textContent="✓ Uploaded"}
msg.textContent="Saving…";const platform=f.elements.platform.value;
const r=await fetch(location.pathname+"/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({answers:{platform,notes:f.elements.notes.value},klaviyo_key:platform==="none"?"":document.getElementById("key").value})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Something went wrong");
f.innerHTML="<section><h2>Saved</h2><p>The onboarding is starting in ${esc(client)}'s Slack channel. Updates and the doc links will be posted there.</p></section>"}catch(err){msg.textContent=err.message;go.disabled=false}};
</script></body></html>`;
}
