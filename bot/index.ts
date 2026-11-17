// Fluid Slack bot (Socket Mode: runs on this machine, no public URL needed).
//   @Fluid <request>      in a client channel → runs strategy / copy / design / onboarding for that client
//   reply in the thread  → continues the same conversation (no need to @mention again)
//   /fluid link <folder> → admins link a channel to a client folder (clients/<folder>)
//   /fluid unlink · /fluid status · /fluid help
// Start: npm run bot
import { App, LogLevel } from "@slack/bolt";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { CLIENTS_DIR, config } from "./config";
import { audit, clientForChannel, db, isBotThread, linkChannel, saveThread, threadSession, unlinkChannel, type LinkedClient } from "./db";
import { checkUser, REFUSAL, screenRequest } from "./security";
import { runAgent } from "./agent";
import { pullLatest, saveClientFolder } from "./git";
import { foreignNames, scanText } from "../lib/leaks";

const app = new App({ token: config.slackBotToken(), appToken: config.slackAppToken(), socketMode: true, logLevel: LogLevel.WARN });
let TEAM_ID = "", BOT_USER_ID = "";
const busy = new Set<string>();

const toSlack = (md: string) =>
  md
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "<$2|$1>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "`$2`");

function chunks(s: string, n = 3500) {
  const out: string[] = [];
  let rest = s;
  while (rest.length > n) { const cut = rest.lastIndexOf("\n", n) > n / 2 ? rest.lastIndexOf("\n", n) : n; out.push(rest.slice(0, cut)); rest = rest.slice(cut); }
  if (rest.trim()) out.push(rest);
  return out;
}

async function handle(args: { text: string; channel: string; ts: string; threadTs?: string; user?: string; team?: string }) {
  const { channel, user } = args;
  const team = args.team ?? TEAM_ID;
  const threadTs = args.threadTs ?? args.ts;
  const web = app.client;
  const request = args.text.replace(new RegExp(`<@${BOT_USER_ID}>`, "g"), "").trim();
  const ephemeral = (text: string) => user && web.chat.postEphemeral({ channel, user, thread_ts: threadTs, text }).catch(() => {});

  // 1. Who
  const who = await checkUser(web, user, TEAM_ID);
  if (!who.ok || team !== TEAM_ID) {
    await audit({ team_id: team, channel_id: channel, thread_ts: threadTs, user_id: user, request, outcome: "refused_user", reason: who.reason || "other workspace" });
    await ephemeral("Sorry, I only take requests from Fluid's team.");
    return;
  }
  // 2. Where
  const client = channel.startsWith("D") ? null : await clientForChannel(channel, TEAM_ID);
  if (!client || !existsSync(join(CLIENTS_DIR, client.folder))) {
    await audit({ team_id: team, channel_id: channel, thread_ts: threadTs, user_id: user, request, outcome: "refused_channel", reason: client ? `folder ${client.folder} missing` : "channel not linked" });
    await ephemeral(channel.startsWith("D") ? "I only work inside a client's channel, so mention me there." : "This channel isn't linked to a client yet. An admin can run `/fluid link <client-folder>`.");
    return;
  }
  if (!request) { await ephemeral(`Tell me what you need for ${client.name}, like "write the copy for the Nov 20 cacao guide".`); return; }

  // 3. What
  const names = await foreignNames(CLIENTS_DIR, client.folder, db());
  const screen = await screenRequest(request, client.name, names);
  if (!screen.allowed) {
    await audit({ team_id: team, channel_id: channel, thread_ts: threadTs, user_id: user, client_id: client.id, request, outcome: "refused_request", reason: screen.reason });
    await web.chat.postMessage({ channel, thread_ts: threadTs, text: REFUSAL(client.name) });
    await ephemeral(`Only you can see this: I refused because the request ${screen.reason.replace(/\(.*\)/, "").trim() || "is outside this client"}. Each channel only gets its own client's work.`);
    return;
  }

  const key = `${channel}:${threadTs}`;
  if (busy.has(key)) { await ephemeral("I'm still working on the last message in this thread. I'll pick up new ones when it's done."); return; }
  busy.add(key);
  try {
    await run(client, { channel, threadTs, user, team, request, names, ts: args.ts });
  } finally {
    busy.delete(key);
  }
}

async function run(client: LinkedClient, a: { channel: string; threadTs: string; user?: string; team: string; request: string; names: Awaited<ReturnType<typeof foreignNames>>; ts: string }) {
  const web = app.client;
  await web.reactions.add({ channel: a.channel, timestamp: a.ts, name: "eyes" }).catch(() => {});
  const status = await web.chat.postMessage({ channel: a.channel, thread_ts: a.threadTs, text: "On it…" });
  let last = 0, lastLabel = "";
  const progress = (label: string) => {
    // Minimal by design: no step-by-step updates in the channel (they go to the console only).
    if (label === lastLabel || Date.now() - last < 4000) return;
    last = Date.now(); lastLabel = label;
    console.log(`[${client.folder}] ${label}`);
  };

  const sessionId = await threadSession(a.channel, a.threadTs, client.id);
  await saveThread(a.channel, a.threadTs, client.id, sessionId);
  let who = "";
  try { const u = await web.users.info({ user: a.user! }); who = u.user?.real_name || u.user?.name || ""; } catch {}
  const prompt = `${who ? `${who} (Fluid team) asks in Slack:` : "Request from Slack:"}\n\n${a.request}`;

  await pullLatest();
  const res = await runAgent({ folder: client.folder, clientId: client.id, clientName: client.name, prompt, sessionId, onProgress: progress });
  await saveThread(a.channel, a.threadTs, client.id, res.sessionId);
  await saveClientFolder(client.folder, `${client.folder}: ${a.request.replace(/\s+/g, " ").slice(0, 80)} (via Slack)`);

  if (res.error) {
    await web.chat.update({ channel: a.channel, ts: status.ts!, text: `Sorry, that didn't finish (${res.error}). Try again, or make the ask smaller.` });
    await audit({ team_id: a.team, channel_id: a.channel, thread_ts: a.threadTs, user_id: a.user, client_id: client.id, request: a.request, outcome: "error", reason: res.error, cost_usd: res.costUsd });
    return;
  }

  // 4. Out: scan the reply and every file before anything is posted.
  const files = res.changed.filter((p) => /\.(md|txt|json|html|csv)$/i.test(p) && statSync(p).size < 900_000).slice(0, 10);
  const problems = [...scanText(res.text, a.names).map((p) => `reply: ${p}`)];
  for (const f of files) for (const p of scanText(readFileSync(f, "utf8"), a.names)) problems.push(`${basename(f)}: ${p}`);
  if (problems.length) {
    await web.chat.update({ channel: a.channel, ts: status.ts!, text: "I finished, but held the reply back because it didn't pass the safety check. Someone at Fluid will review it." });
    await audit({ team_id: a.team, channel_id: a.channel, thread_ts: a.threadTs, user_id: a.user, client_id: client.id, request: a.request, outcome: "blocked_output", reason: problems.join("; ").slice(0, 2000), cost_usd: res.costUsd });
    return;
  }

  const parts = chunks(toSlack(res.text || "Done."));
  await web.chat.update({ channel: a.channel, ts: status.ts!, text: parts[0] });
  for (const p of parts.slice(1)) await web.chat.postMessage({ channel: a.channel, thread_ts: a.threadTs, text: p });
  if (files.length) {
    await web.files.uploadV2({
      channel_id: a.channel,
      thread_ts: a.threadTs,
            file_uploads: files.map((f) => ({ file: f, filename: basename(f), title: relative(join(CLIENTS_DIR, client.folder), f) })),
    } as any).catch((e: any) => console.error("upload failed:", e.data?.error ?? e.message));
  }
  await web.reactions.remove({ channel: a.channel, timestamp: a.ts, name: "eyes" }).catch(() => {});
  await web.reactions.add({ channel: a.channel, timestamp: a.ts, name: "white_check_mark" }).catch(() => {});
  await audit({ team_id: a.team, channel_id: a.channel, thread_ts: a.threadTs, user_id: a.user, client_id: client.id, request: a.request, outcome: "ran", cost_usd: res.costUsd });
}

// @Fluid in a channel (top level or in a thread)
app.event("app_mention", async ({ event }) => {
  const e = event as any;
  handle({ text: e.text ?? "", channel: e.channel, ts: e.ts, threadTs: e.thread_ts, user: e.user, team: e.team }).catch((err) => console.error(err));
});

// Replies inside a thread the bot is already in (no @mention needed)
app.event("message", async ({ event }) => {
  const e = event as any;
  if (e.subtype || e.bot_id || !e.thread_ts || !e.text || e.text.includes(`<@${BOT_USER_ID}>`)) return;
  if (!(await isBotThread(e.channel, e.thread_ts))) return;
  handle({ text: e.text, channel: e.channel, ts: e.ts, threadTs: e.thread_ts, user: e.user, team: e.team }).catch((err) => console.error(err));
});

app.command("/fluid", async ({ command, ack, respond }) => {
  await ack();
  const [sub = "help", arg = ""] = command.text.trim().split(/\s+/);
  const reply = async (text: string): Promise<void> => { await respond({ response_type: "ephemeral", text }); };
  if (command.team_id !== TEAM_ID) return reply("This workspace isn't allowed to use Fluid.");
  const who = await checkUser(app.client, command.user_id, TEAM_ID);
  if (!who.ok) return reply("Sorry, I only take requests from Fluid's team.");

  if (sub === "status") {
    const c = await clientForChannel(command.channel_id, TEAM_ID);
    return reply(c ? `This channel is linked to *${c.name}* (folder \`${c.folder}\`). I only work on ${c.name} here.` : "This channel isn't linked to a client.");
  }
  if (sub === "link" || sub === "unlink") {
    const admins = config.adminUserIds();
    if (!admins.includes(command.user_id)) return reply(admins.length ? "Only Fluid admins can link channels." : "No admins are set yet. Add your Slack member ID to SLACK_ADMIN_USER_IDS in .env.local and restart the bot.");
    if (sub === "unlink") {
      await unlinkChannel(command.channel_id);
      await audit({ team_id: TEAM_ID, channel_id: command.channel_id, user_id: command.user_id, outcome: "unlinked" });
      return reply("Unlinked. I won't work in this channel until it's linked again.");
    }
    if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(arg) || !existsSync(join(CLIENTS_DIR, arg, "memory.md"))) return reply("Give the client's folder name, like `/fluid link dolce`. New client? Run `clients/new-client.sh <folder> \"<Name>\"` first.");
    if (command.channel_id.startsWith("D")) return reply("Link a client channel, not a DM.");
    const readme = join(CLIENTS_DIR, arg, "README.md");
    const name = (existsSync(readme) && readFileSync(readme, "utf8").match(/^# (.+?)(\s+—.*)?$/m)?.[1]?.trim()) || arg;
    const existing = await clientForChannel(command.channel_id, TEAM_ID);
    const c = await linkChannel(command.channel_id, TEAM_ID, arg, name, command.user_id);
    await audit({ team_id: TEAM_ID, channel_id: command.channel_id, user_id: command.user_id, client_id: c.id, outcome: "linked", reason: existing && existing.id !== c.id ? `relinked from ${existing.folder}` : undefined });
    return reply(`Linked. This channel now belongs to *${c.name}*, and I'll only work on ${c.name} here.`);
  }
  return reply("Mention me with what you need for this channel's client, like `@Fluid write the copy for the cacao guide`, then reply in the thread to keep going.\n`/fluid status` shows which client this channel belongs to. Admins: `/fluid link <folder>`, `/fluid unlink`.");
});

// Keep reporting data fresh while the bot runs: re-sync any Klaviyo-connected client not synced in 20h.
async function syncStale() {
  try {
    const { syncKlaviyo } = await import("../lib/klaviyo/sync");
    const { data: cl } = await db().from("clients").select("id, name, client_connections!inner(provider, status)").eq("client_connections.provider", "klaviyo").eq("client_connections.status", "connected");
    for (const c of cl ?? []) {
      const { data: last } = await db().from("klaviyo_attributed_revenue_daily").select("synced_at").eq("client_id", c.id).order("synced_at", { ascending: false }).limit(1).maybeSingle();
      if (last && Date.now() - Date.parse(last.synced_at) < 20 * 3600_000) continue;
      const r = await syncKlaviyo(c.id);
      console.log(`[sync] ${c.name}: ${r.ok ? "ok" : `failed ${r.error}`}`);
    }
  } catch (e: any) { console.error("[sync] error:", e.message); }
}

(async () => {
  const missing = ["ANTHROPIC_API_KEY", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SLACK_BOT_TOKEN", "SLACK_APP_TOKEN", "SLACK_ADMIN_USER_IDS"].filter((k) => !process.env[k]);
  if (missing.length) console.error(`⚠️  Missing variable(s): ${missing.join(", ")}. The bot can't work until they're set.`);
  const auth = await app.client.auth.test();
  TEAM_ID = auth.team_id!; BOT_USER_ID = auth.user_id!;
  await app.start();
  console.log(`Fluid bot is running in ${auth.team} as @${auth.user}. Ctrl+C to stop.`);
  syncStale();
  setInterval(syncStale, 3 * 3600_000);
})();
