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

type Notify = (channel: string, thread: string | null, text: string) => Promise<void>;
const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf" };
const hits = new Map<string, number[]>();
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

export function startWeb(notify: Notify) {
  const port = Number(process.env.PORT || 8080);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://x");
      const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "").split(",")[0].trim();
      if (url.pathname === "/health") return send(res, 200, "ok");
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
          if (r.slack_channel) notify(r.slack_channel, r.slack_thread, `✅ ${author} approved *${r.title}* (v${r.current_version}).`).catch(() => {});
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
.pin{position:absolute;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50% 50% 50% 0;background:var(--accent);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);cursor:pointer;z-index:2}
.pin.done{background:#9b9b9b}.pin.sel{outline:3px solid #1d1d1d}
aside{flex:1 1 320px;max-width:420px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px}
aside h2{font-size:14px;margin:0 0 10px}.c{border-top:1px solid var(--line);padding:10px 0}.c.sel{background:#fff8f3}
.c .who{font-weight:600;font-size:13px}.c .who em{font-style:normal;color:var(--muted);font-weight:400}.c p{margin:4px 0;white-space:pre-wrap;word-wrap:break-word}
.r{margin:6px 0 0 14px;padding-left:10px;border-left:2px solid var(--line)}.r.bot .who{color:var(--accent)}
.row{display:flex;gap:6px;margin-top:6px}textarea{font:inherit;width:100%;border:1px solid var(--line);border-radius:8px;padding:8px;min-height:60px;resize:vertical}
.hint{color:var(--muted);font-size:13px}
#fit{flex:0 0 auto;max-width:100%;overflow:hidden}.stage{transform-origin:top left}
#composer{position:absolute;z-index:4;width:280px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px;box-shadow:0 8px 30px rgba(0,0,0,.18);display:none}
@media (max-width:700px){main{padding:12px 8px}aside{max-width:none}}
</style></head><body>
<header><h1 id="t">Loading…<small id="sub"></small></h1>
<span id="status" class="pill review"></span>
<select id="ver" aria-label="Version"></select>
<button id="view">Mobile view</button>
<button id="cm" class="on">Comment</button>
<button id="ap" class="primary">Approve</button></header>
<main id="main"><div id="fit"><div class="stage" id="stage"><iframe id="f" title="Email design" scrolling="no"></iframe><div class="overlay" id="ov"></div><div id="composer"><textarea id="ctext" placeholder="What should change here?"></textarea><div class="row"><button class="primary" id="csave">Comment</button><button id="ccancel">Cancel</button></div></div></div></div>
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
addEventListener("resize",fit);
function tops(){return S.comments.filter(c=>!c.parent_id&&c.version===ver)}
function pins(){document.querySelectorAll(".pin").forEach(p=>p.remove());tops().forEach((c,i)=>{const p=document.createElement("div");p.className="pin"+(c.resolved?" done":"")+(sel===c.id?" sel":"");p.style.left=c.x+"px";p.style.top=c.y+"px";p.textContent=i+1;p.onclick=(e)=>{e.stopPropagation();sel=c.id;render()};$("stage").appendChild(p)})}
function render(){pins();const list=tops();$("list").innerHTML=list.length?list.map((c,i)=>{const rs=S.comments.filter(x=>x.parent_id===c.id);return '<div class="c'+(sel===c.id?" sel":"")+'" data-id="'+c.id+'"><div class="who">'+(i+1)+". "+esc(c.author_name)+(c.resolved?" <em>· resolved</em>":"")+'</div><p>'+esc(c.body)+"</p>"+rs.map(r=>'<div class="r'+(r.author_kind==="bot"?" bot":"")+'"><div class="who">'+esc(r.author_kind==="bot"?"Fluid":r.author_name)+"</div><p>"+esc(r.body)+"</p></div>").join("")+'<div class="row"><button data-reply="'+c.id+'">Reply</button><button data-res="'+c.id+'">'+(c.resolved?"Reopen":"Resolve")+"</button></div></div>"}).join(""):'<p class="hint">No comments on this version yet.</p>';}
$("list").onclick=async(e)=>{const id=e.target.dataset.reply,rid=e.target.dataset.res;if(id){const n=who();if(!n)return;const t=(prompt("Your reply:")||"").trim();if(!t)return;await api("/comments",{author:n,body:t,parent_id:id,version:ver}).catch(a=>alert(a.message));await load(true)}if(rid){const c=S.comments.find(x=>x.id===rid);await api("/resolve",{author:who()||"Reviewer",comment_id:rid,resolved:!c.resolved});await load(true)}const box=e.target.closest(".c");if(box&&!id&&!rid){sel=box.dataset.id;render()}};
$("ov").onclick=(e)=>{const r=$("ov").getBoundingClientRect(),k=600/r.width;pending={x:Math.round((e.clientX-r.left)*k),y:Math.round((e.clientY-r.top)*k)};const c=$("composer");c.style.left=Math.max(0,Math.min(pending.x-140,320))+"px";c.style.top=pending.y+"px";c.style.display="block";$("ctext").value="";$("ctext").focus()};
$("ccancel").onclick=()=>{$("composer").style.display="none";pending=null};
$("csave").onclick=async()=>{const n=who();if(!n||!pending)return;const t=$("ctext").value.trim();if(!t)return;try{await api("/comments",{author:n,body:t,x:pending.x,y:pending.y,version:ver});$("composer").style.display="none";pending=null;await load(true)}catch(a){alert(a.message)}};
$("cm").onclick=()=>{$("main").classList.toggle("commenting");$("cm").classList.toggle("on")};$("main").classList.add("commenting");
$("view").onclick=()=>{mobile=!mobile;$("view").textContent=mobile?"Desktop view":"Mobile view";fit()};
$("ver").onchange=()=>{ver=Number($("ver").value);sel=null;frame();render()};
$("ap").onclick=async()=>{const n=who();if(!n)return;if(!confirm("Approve version "+S.current+" of this email as it is now?"))return;await api("/approve",{author:n}).catch(a=>alert(a.message));await load(true)};
load().then(frame).catch(e=>{document.body.innerHTML="<p style='padding:24px'>"+esc(e.message)+"</p>"});
setInterval(()=>load(true).catch(()=>{}),30000);
</script></body></html>`;
