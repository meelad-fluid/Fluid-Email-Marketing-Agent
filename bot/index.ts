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
import { pullLatest, saveClientFolder, watchForCodeUpdates } from "./git";
import { startWeb, type ReviewAction } from "./web";
import { internalLink, newConnectLink, ONBOARDING_PROMPT, runAudits, setupInChannel, shopifyLink } from "./onboarding";
import { foreignNames, scanText } from "../lib/leaks";
import { filesNote, receiveFiles, type SlackFile } from "./slack-files";
import { proactiveTick, type Client as ProactiveClient } from "./proactive";

const app = new App({ token: config.slackBotToken(), appToken: config.slackAppToken(), socketMode: true, logLevel: LogLevel.WARN });
let TEAM_ID = "", BOT_USER_ID = "";
const busy = new Set<string>();
const onboardingActive = new Set<string>();

// Rough time each kind of job takes, from the words in the request.
function estimateMinutes(text: string) {
  const t = text.toLowerCase();
  if (/onboard/.test(t)) return 20;
  if (/design|redesign|rebuild|mock ?up|layout/.test(t)) return 10;
  if (/strategy|plan|calendar|flows?\b/.test(t)) return 7;
  if (/klaviyo|push|draft|segment/.test(t)) return 4;
  if (/copy|write|rewrite|subject/.test(t)) return 4;
  if (/recap|report|numbers|how did/.test(t)) return 2;
  return 5;
}

/** After 2 minutes, post one "still working" note in the thread and keep it updated with the step and time left. */
function progressNotes(web: typeof app.client, channel: string, thread: string, estimate: number) {
  const started = Date.now();
  let msgTs: string | undefined, step = "";
  const text = () => {
    const mins = Math.round((Date.now() - started) / 60000);
    const left = Math.max(1, Math.round(estimate - mins));
    const what = step ? `the ${step}` : "it";
    return mins >= estimate ? `Still working on ${what}, almost there.` : `Still working on ${what}, will be ready in about ${left} minute${left === 1 ? "" : "s"}.`;
  };
  const tick = async () => {
    try {
      if (!msgTs) msgTs = (await web.chat.postMessage({ channel, thread_ts: thread, text: text() })).ts;
      else await web.chat.update({ channel, ts: msgTs, text: text() });
    } catch {}
  };
  const first = setTimeout(() => { tick(); timer = setInterval(tick, 3 * 60_000); }, 2 * 60_000);
  let timer: NodeJS.Timeout | undefined;
  return {
    step: (label: string) => { if (label) step = label; }, // "" keeps the current stage
    done: async () => { clearTimeout(first); if (timer) clearInterval(timer); if (msgTs) await web.chat.delete({ channel, ts: msgTs }).catch(() => {}); },
  };
}

const toSlack = (md: string) =>
  md
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "<$2|$1>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "`$2`")
    // Any raw link to our own review/doc pages becomes a hyperlink (the bot is told never to paste raw URLs; this is the safety net).
    .replace(/(?<![<|(\w/])(?:https?:\/\/)?([a-z0-9-]+\.up\.railway\.app|[a-z0-9.-]*fluidcreatives\.com)(\/(r|d)\/[A-Za-z0-9_-]+)(?![^<]*>)/g, (_m, host, path, kind) => `<https://${host}${path}|${kind === "r" ? "review link" : "doc"}>`)
    // Slack doesn't render Markdown lists: real bullet characters, indented sub-bullets.
    .replace(/^( {2,}|\t+)[-*]\s+/gm, "        ◦ ")
    .replace(/^[-*]\s+/gm, "• ");

function chunks(s: string, n = 3500) {
  const out: string[] = [];
  let rest = s;
  while (rest.length > n) { const cut = rest.lastIndexOf("\n", n) > n / 2 ? rest.lastIndexOf("\n", n) : n; out.push(rest.slice(0, cut)); rest = rest.slice(cut); }
  if (rest.trim()) out.push(rest);
  return out;
}

async function handle(args: { text: string; channel: string; ts: string; threadTs?: string; user?: string; team?: string; files?: SlackFile[] }) {
  const { channel, user } = args;
  const team = args.team ?? TEAM_ID;
  const threadTs = args.threadTs ?? args.ts;
  const web = app.client;
  // Files with no words ("@Fluid" + screenshots): treat it as "store these".
  const request = args.text.replace(new RegExp(`<@${BOT_USER_ID}>`, "g"), "").trim() || (args.files?.length ? "Store these in the client library." : "");
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

  // Keys pasted into Slack: never used. Point to a private link instead.
  if (/\bpk_[A-Za-z0-9_]{12,}|\bsk-ant-[A-Za-z0-9_-]{10,}|\bshp(at|ss)_[A-Za-z0-9]{10,}|\bxox[bpa]-|\bgithub_pat_/.test(request)) {
    await audit({ team_id: team, channel_id: channel, thread_ts: threadTs, user_id: user, client_id: client.id, request: "[message with an API key, not stored]", outcome: "refused_request", reason: "API key pasted in Slack" });
    const link = await newConnectLink(client.id).catch(() => null);
    await ephemeral(`Only you can see this: please don't paste API keys in Slack (they stay in the channel history). I didn't use it. ${link ? `Paste it here instead, it's stored encrypted: ${link}` : "Use the client's onboarding link instead."} Then say "run the onboarding". Since this key was posted, it's safest to delete that message and create a new key in Klaviyo.`);
    return;
  }

  // Asking how to connect Klaviyo (or for a key/onboarding link): answer with a fresh secure link.
  if (/(link|connect|send|add|give|share|paste|submit|where)[^.?!]{0,60}(klaviyo|api)[^.?!]{0,20}(key|access|account)?|klaviyo[^.?!]{0,30}(key|connect)[^.?!]{0,40}(link|where|how)|onboarding link|connect link/i.test(request) && !/\b(draft|push|build|template|campaign|email|design|segment|audience)\b/i.test(request)) {
    const link = await newConnectLink(client.id).catch(() => null);
    await audit({ team_id: team, channel_id: channel, thread_ts: threadTs, user_id: user, client_id: client.id, request, outcome: "ran", reason: "sent a connect link" });
    await web.chat.postMessage({ channel, thread_ts: threadTs, text: link ? `Here's a secure link to connect Klaviyo (works once, key stored encrypted): ${link}\nOnce it's in, I'll start the onboarding automatically.` : "I couldn't make a link right now, try again in a minute." });
    return;
  }

  // 3. What
  const names = await foreignNames(CLIENTS_DIR, client.folder, db());
  const screen = await screenRequest(request, client.name, names);
  if (!screen.allowed && screen.reason.startsWith("screen unavailable")) {
    // Our own setup problem (e.g. a missing API key), not the request: fail closed, but say what's wrong.
    await audit({ team_id: team, channel_id: channel, thread_ts: threadTs, user_id: user, client_id: client.id, request, outcome: "error", reason: screen.reason });
    await ephemeral(`Only you can see this: I couldn't run my safety check, so I didn't answer. Setup problem: ${screen.reason.replace(/^screen unavailable \((.*)\)$/, "$1").replace(/ from \.env\.local/, "")}.`);
    return;
  }
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
    await run(client, { channel, threadTs, user, team, request, names, ts: args.ts, files: args.files, inThread: !!args.threadTs });
  } finally {
    busy.delete(key);
  }
}

async function run(client: LinkedClient, a: { channel: string; threadTs: string; user?: string; team: string; request: string; names: Awaited<ReturnType<typeof foreignNames>>; ts: string; files?: SlackFile[]; inThread?: boolean }) {
  const web = app.client;
  // ⏳ on their message while working (no "On it…" message); it comes off when the reply is posted.
  await web.reactions.add({ channel: a.channel, timestamp: a.ts, name: "hourglass_flowing_sand" }).catch(() => {});
  const reply = async (text: string) => {
    await web.chat.postMessage({ channel: a.channel, thread_ts: a.threadTs, text });
    await web.reactions.remove({ channel: a.channel, timestamp: a.ts, name: "hourglass_flowing_sand" }).catch(() => {});
  };
  let last = 0, lastLabel = "";
  const notes = progressNotes(web, a.channel, a.threadTs, estimateMinutes(a.request));
  const progress = (label: string) => {
    notes.step(label);
    if (!label) return;
    // Minimal by design: no step-by-step updates in the channel (they go to the console only).
    if (label === lastLabel || Date.now() - last < 4000) return;
    last = Date.now(); lastLabel = label;
    console.log(`[${client.folder}] ${label}`);
  };

  const sessionId = await threadSession(a.channel, a.threadTs, client.id);
  await saveThread(a.channel, a.threadTs, client.id, sessionId);
  let who = "";
  try { const u = await web.users.info({ user: a.user! }); who = u.user?.real_name || u.user?.name || ""; } catch {}
  await pullLatest();
  // Files in this message (and earlier in the thread) land in inbox/ so the agent can open and store them.
  let shared = "";
  if (a.files?.length || a.inThread) {
    try { shared = filesNote(await receiveFiles(web, join(CLIENTS_DIR, client.folder), { channel: a.channel, threadTs: a.inThread ? a.threadTs : undefined, ts: a.ts, files: a.files })); }
    catch (e: any) { console.error("[files]", e.message); shared = "\n\n(Files were shared, but I couldn't download them: " + e.message + ")"; }
  }
  const prompt = `${who ? `${who} (Fluid team) asks in Slack:` : "Request from Slack:"}\n\n${a.request}${shared}`;

  let res = await runAgent({ folder: client.folder, clientId: client.id, clientName: client.name, slack: { channel: a.channel, thread: a.threadTs }, prompt, sessionId, requester: who || undefined, onProgress: progress });
  if (res.error && sessionId && !res.costUsd) {
    // The saved conversation is gone (the server restarted). Start fresh, with the thread so far as context.
    let history = "";
    try {
      const h = await web.conversations.replies({ channel: a.channel, ts: a.threadTs, limit: 30 });
      history = (h.messages ?? []).filter((m: any) => m.ts !== a.ts && m.text && m.text !== "On it…").slice(-20)
        .map((m: any) => `${m.bot_id ? "Fluid" : "Team"}: ${String(m.text).replace(new RegExp(`<@${BOT_USER_ID}>`, "g"), "").trim()}`).join("\n");
    } catch {}
    res = await runAgent({ folder: client.folder, clientId: client.id, clientName: client.name, slack: { channel: a.channel, thread: a.threadTs },
      prompt: history ? `Earlier in this Slack thread:\n${history}\n\n---\n${prompt}` : prompt, requester: who || undefined, onProgress: progress });
  }
  await notes.done();
  await saveThread(a.channel, a.threadTs, client.id, res.sessionId);
  await saveClientFolder(client.folder, `${client.folder}: ${a.request.replace(/\s+/g, " ").slice(0, 80)} (via Slack)`);

  if (res.error) {
    await reply(`Sorry, that didn't finish (${res.error}). Try again, or make the ask smaller.`);
    await audit({ team_id: a.team, channel_id: a.channel, thread_ts: a.threadTs, user_id: a.user, client_id: client.id, request: a.request, outcome: "error", reason: res.error, cost_usd: res.costUsd });
    return;
  }

  // 4. Out: scan the reply and every file before anything is posted.
  const files = res.changed.filter((p) => /\.(md|txt|json|html|csv)$/i.test(p) && statSync(p).size < 900_000).slice(0, 10);
  const problems = [...scanText(res.text, a.names).map((p) => `reply: ${p}`)];
  for (const f of files) for (const p of scanText(readFileSync(f, "utf8"), a.names)) problems.push(`${basename(f)}: ${p}`);
  if (problems.length) {
    await reply("I finished, but held the reply back because it didn't pass the safety check. Someone at Fluid will review it.");
    await audit({ team_id: a.team, channel_id: a.channel, thread_ts: a.threadTs, user_id: a.user, client_id: client.id, request: a.request, outcome: "blocked_output", reason: problems.join("; ").slice(0, 2000), cost_usd: res.costUsd });
    return;
  }

  const parts = chunks(toSlack(res.text || "Done."));
  await reply(parts[0]);
  for (const p of parts.slice(1)) await web.chat.postMessage({ channel: a.channel, thread_ts: a.threadTs, text: p });
  // No file attachments in Slack: work is shared as links (review links), never as .md/.html files.
  await audit({ team_id: a.team, channel_id: a.channel, thread_ts: a.threadTs, user_id: a.user, client_id: client.id, request: a.request, outcome: "ran", cost_usd: res.costUsd });
}

// @Fluid in a channel (top level or in a thread)
app.event("app_mention", async ({ event }) => {
  const e = event as any;
  handle({ text: e.text ?? "", channel: e.channel, ts: e.ts, threadTs: e.thread_ts, user: e.user, team: e.team, files: e.files }).catch((err) => console.error(err));
});

// Replies inside a thread the bot is already in (no @mention needed)
app.event("message", async ({ event }) => {
  const e = event as any;
  // file_share = a reply with attachments ("here are the rest" + screenshots); every other subtype is an edit/join/etc.
  if ((e.subtype && e.subtype !== "file_share") || e.bot_id || !e.thread_ts || !e.text || e.text.includes(`<@${BOT_USER_ID}>`)) return;
  // Only answer what's meant for the bot: not messages to a teammate (@someone, @here, a user group),
  // not a plain "thanks / great", and only when the message is a reply to the bot's last message.
  const others = [...e.text.matchAll(/<@([A-Z0-9]+)(\|[^>]*)?>/g)].map((m) => m[1]).filter((id) => id !== BOT_USER_ID);
  if (others.length || /<!(here|channel|everyone|subteam)/.test(e.text)) return;
  if (/^\s*(thanks|thank you|thx|ty|great|nice|cool|perfect|awesome|love it|ok|okay|got it|sounds good|👍|🙏|🔥)[\s!.]*$/i.test(e.text)) return;
  if (!(await isBotThread(e.channel, e.thread_ts))) return;
  try {
    const r = await app.client.conversations.replies({ channel: e.channel, ts: e.thread_ts, latest: e.ts, inclusive: false, limit: 200 });
    const before = (r.messages ?? []).filter((m: any) => Number(m.ts) < Number(e.ts)).pop() as any;
    if (before && !before.bot_id && before.user !== BOT_USER_ID) return; // the last word wasn't the bot's: people are talking to each other
  } catch { /* if Slack can't tell us, fall through and answer */ }
  handle({ text: e.text, channel: e.channel, ts: e.ts, threadTs: e.thread_ts, user: e.user, team: e.team, files: e.files }).catch((err) => console.error(err));
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
  // Onboarding runs in the client's own internal channel: no new channels. Posts a one-use upload link there
  // (onboarding doc PDF + optional Klaviyo / Customer.io key) and runs the onboarding once it's submitted.
  if (sub === "onboard" || sub === "add" || sub === "current") {
    if (!config.adminUserIds().includes(command.user_id)) return reply("Only Fluid admins can onboard clients.");
    const rest = command.text.trim().slice(sub.length).trim();
    if (!rest) {
      const c = await clientForChannel(command.channel_id, TEAM_ID);
      if (!c) return reply("Run `/fluid onboard Client Name` inside the client's internal channel.");
      return reply(`Onboarding upload link for ${c.name} (only you can see this, works once, 14 days): ${await internalLink(c.id)}`);
    }
    const [name, website] = rest.split("|").map((x) => x.trim()); // "| brand.com" still works but isn't needed
    if (!name) return reply("Use: `/fluid onboard Client Name` inside the client's internal channel.");
    try {
      const r = await setupInChannel(app.client, { name, website, channelId: command.channel_id, requestedBy: command.user_id, teamId: TEAM_ID });
      await audit({ team_id: TEAM_ID, channel_id: r.channelId, user_id: command.user_id, client_id: r.clientId, outcome: "linked", reason: `onboarding ${name}` });
      return reply(`Done. This channel now belongs to ${name}, and the onboarding upload link is posted above.`);
    } catch (e: any) { return reply(`Couldn't set up ${name}: ${e.message}`); }
  }
  // Shopify connect link, and the two write switches (each client starts read-only everywhere).
  // Proactive check-ins and the client's timezone (they run on the client's local time).
  if (sub === "proactive" || sub === "timezone") {
    const c = await clientForChannel(command.channel_id, TEAM_ID);
    if (!c) return reply("Run this inside the client's channel.");
    const { data: row } = await db().from("clients").select("proactive, timezone").eq("id", c.id).single();
    const p = { report: true, wins: true, approvals: true, ...((row as any)?.proactive ?? {}) } as Record<string, boolean>;
    const show = () => `Proactive posts for ${c.name} (${(row as any)?.timezone}): weekly report (Mon) *${p.report ? "on" : "off"}*, weekly win (Thu) *${p.wins ? "on" : "off"}*, approval reminders *${p.approvals ? "on" : "off"}*.`;
    const admin = config.adminUserIds().includes(command.user_id);
    if (sub === "timezone") {
      if (!arg) return reply(`${c.name}'s timezone: ${(row as any)?.timezone}. Change it with \`/fluid timezone ET\` (ET, CT, MT, PT, or a zone like Europe/London).`);
      if (!admin) return reply("Only Fluid admins can change that.");
      const tz = ({ ET: "America/New_York", CT: "America/Chicago", MT: "America/Denver", PT: "America/Los_Angeles" } as Record<string, string>)[arg.toUpperCase()] ?? arg;
      try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); } catch { return reply("That isn't a timezone I know. Use ET, CT, MT, PT, or a zone like Europe/London."); }
      await db().from("clients").update({ timezone: tz }).eq("id", c.id);
      return reply(`Done. ${c.name} runs on ${tz} now.`);
    }
    const words = command.text.trim().split(/\s+/).slice(1).map((w) => w.toLowerCase());
    if (!words.length) return reply(`${show()}\nChange with \`/fluid proactive off\`, or one at a time: \`/fluid proactive report|wins|approvals on|off\`.`);
    if (!admin) return reply("Only Fluid admins can change that.");
    const state = words.includes("off") ? false : words.includes("on") ? true : null;
    if (state === null) return reply("Add on or off, like `/fluid proactive wins off`.");
    const which = words.filter((w) => ["report", "reports", "wins", "win", "approvals", "approval"].includes(w)).map((w) => (w.startsWith("report") ? "report" : w.startsWith("win") ? "wins" : "approvals"));
    for (const k of which.length ? which : ["report", "wins", "approvals"]) p[k] = state;
    await db().from("clients").update({ proactive: p }).eq("id", c.id);
    await audit({ team_id: TEAM_ID, channel_id: command.channel_id, user_id: command.user_id, client_id: c.id, outcome: "setting", reason: `proactive = ${JSON.stringify(p)}` });
    return reply(`Done. ${show()}`);
  }
  if (["shopify", "shopify-discounts", "klaviyo-drafts"].includes(sub)) {
    if (!config.adminUserIds().includes(command.user_id)) return reply("Only Fluid admins can do that.");
    const c = await clientForChannel(command.channel_id, TEAM_ID);
    if (!c) return reply("Run this inside the client's channel.");
    if (sub === "shopify") return reply(`Shopify connect link for ${c.name} (only you can see this, works once, 14 days): ${await shopifyLink(c.id)}`);
    const on = arg === "on", off = arg === "off";
    const col = sub === "shopify-discounts" ? "shopify_write" : "klaviyo_write", val = sub === "shopify-discounts" ? "discounts" : "drafts";
    if (!on && !off) { const { data } = await db().from("clients").select(col).eq("id", c.id).single(); return reply(`${sub === "shopify-discounts" ? "Shopify discount codes" : "Klaviyo drafts"} for ${c.name}: *${(data as any)?.[col] === val ? "on" : "off"}*. Use \`/fluid ${sub} on\` or \`off\`.`); }
    await db().from("clients").update({ [col]: on ? val : "none" }).eq("id", c.id);
    await audit({ team_id: TEAM_ID, channel_id: command.channel_id, user_id: command.user_id, client_id: c.id, outcome: "setting", reason: `${col} = ${on ? val : "none"}` });
    return reply(sub === "shopify-discounts" ? (on ? `Done. I can now create new discount codes in ${c.name}'s Shopify (never edit or delete existing ones).` : `Done. ${c.name}'s Shopify is read-only for me again.`) : (on ? `Done. I can now build drafts in ${c.name}'s Klaviyo (campaigns, templates, segments, new draft flows; never send or turn anything on).` : `Done. ${c.name}'s Klaviyo is read-only for me again.`));
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
  return reply("`/fluid onboard Client Name` (inside the client's internal channel) links the channel to the client and posts an upload link for their onboarding doc and Klaviyo or Customer.io key. Mention me with what you need for this channel's client, like `@Fluid write the copy for the cacao guide`, then reply in the thread to keep going.\n`/fluid status` shows which client this channel belongs to. Admins: `/fluid link <folder>`, `/fluid unlink`, `/fluid shopify` (connect link), `/fluid klaviyo-drafts on|off`, `/fluid shopify-discounts on|off`, `/fluid proactive` (weekly report, wins, approval reminders), `/fluid timezone`.");
});

// After a client submits the onboarding form: audits, then the onboarding skill, posted in their channel.
async function runOnboarding(f: { clientId: string; folder: string; name: string; klaviyo: string; internal?: boolean }) {
  const web = app.client;
  const { data: ch } = await db().from("slack_channels").select("channel_id").eq("client_id", f.clientId).limit(1).maybeSingle();
  if (!ch) return console.error("[onboard] no channel for", f.folder);
  onboardingActive.add(f.clientId);
  const head = await web.chat.postMessage({ channel: ch.channel_id, text: `${f.internal ? `${f.name}'s onboarding doc is in` : `${f.name} submitted the onboarding form`} (${f.internal ? "email platform" : "Klaviyo"}: ${f.klaviyo}). Running onboarding now, about 20–25 minutes:\n1. Account audit (Klaviyo or Customer.io, if connected) (~10 min)\n2. Website research, Onboarding Doc, month-1 plan and flow plan (~10–15 min)\nI'll post updates here as it goes.` });
  const notes = progressNotes(web, ch.channel_id, head.ts!, 25);
  notes.step("account audit");
  const { data: latest } = await db().from("onboarding_runs").select("id").eq("client_id", f.clientId).eq("status", "waiting_for_form").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (latest) await db().from("onboarding_runs").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", latest.id);
  else await db().from("onboarding_runs").insert({ client_id: f.clientId, status: "running", started_by: "upload" });
  await saveClientFolder(f.folder, `${f.folder}: onboarding form submitted`);
  const audits = await runAudits(f.clientId, f.folder);
  await saveClientFolder(f.folder, `${f.folder}: onboarding audits`);
  await web.chat.postMessage({ channel: ch.channel_id, thread_ts: head.ts!, text: `Step 1 done: ${audits.notes.join(" · ")}.\nStep 2: researching the website and writing the Onboarding Doc and plans, about 10–15 minutes.` });
  notes.step("Onboarding Doc and plans");
  const res = await runAgent({ folder: f.folder, clientId: f.clientId, clientName: f.name, slack: { channel: ch.channel_id, thread: head.ts! }, prompt: ONBOARDING_PROMPT(f.name, audits.notes, f.internal), onProgress: () => {} });
  await notes.done();
  onboardingActive.delete(f.clientId);
  await saveClientFolder(f.folder, `${f.folder}: onboarding doc and plans`);
  const names = await foreignNames(CLIENTS_DIR, f.folder, db());
  const problems = res.error ? [] : scanText(res.text, names);
  const text = res.error ? `Onboarding didn't finish (${res.error}). Ask me to "continue the onboarding" in this thread.` : problems.length ? "Onboarding finished, but I held the summary back because it didn't pass the safety check. Someone at Fluid will review it." : toSlack(res.text);
  for (const p of chunks(text)) await web.chat.postMessage({ channel: ch.channel_id, thread_ts: head.ts!, text: p });
  await saveThread(ch.channel_id, head.ts!, f.clientId, res.sessionId);
  await db().from("onboarding_runs").update({ status: res.error ? "failed" : "done", error: res.error ?? null, updated_at: new Date().toISOString() }).eq("client_id", f.clientId).eq("status", "running");
  await audit({ team_id: TEAM_ID, channel_id: ch.channel_id, thread_ts: head.ts!, client_id: f.clientId, request: "automatic onboarding", outcome: res.error ? "error" : "ran", reason: res.error, cost_usd: res.costUsd });
}

// ── Review page buttons: "Approve & build" and "Submit comments" start the bot without anyone going to Slack.
// The job runs in the design's Slack thread (or the client's channel), exactly like a request typed there.
async function reviewAction(a: ReviewAction) {
  const web = app.client;
  const channel = a.channel ?? (await db().from("slack_channels").select("channel_id").eq("client_id", a.clientId).limit(1).maybeSingle()).data?.channel_id;
  if (!channel) return console.error("[review] no channel for client", a.clientId);
  const client = await clientForChannel(channel, TEAM_ID);
  if (!client) return console.error("[review] channel not linked", channel);
  const short = a.title.split(/\s+[—–-]\s+/)[0];
  const intro = a.kind === "comments" ? `${a.author} submitted ${a.count} comment${a.count === 1 ? "" : "s"} on ${short}. Working on ${a.count === 1 ? "it" : "them"} now.`
    : a.kind === "build_flow" ? `${a.author} approved the last email, so the whole ${a.flow!.toLowerCase()} is approved. Building it in Klaviyo as a draft now.`
    : `${a.author} approved ${short}. Building it in Klaviyo as a draft now.`;
  const posted = await web.chat.postMessage({ channel, thread_ts: a.thread ?? undefined, text: intro });
  const threadTs = a.thread ?? posted.ts!;
  const request = a.kind === "comments"
    ? `${a.author} clicked "Submit comments" on the review page for "${a.title}" (${a.designPath}). Call design_comments, make every change in design.dc.html, publish_design (note = what changed), reply_to_comment under each comment saying what you did (resolve=true), then reply here like a teammate: "Updated [<email>](<link>): <changes>. Take a look."`
    : a.kind === "build_flow" ? `${a.author} approved every email in the ${a.flow} on the review page and clicked "Approve & build". Build the flow in Klaviyo now: write the flow plan from the flow strategy and copy (emails: ${a.designs!.join(", ")}) and call build_klaviyo_flow. Reply with the Klaviyo link and any manual steps.`
    : `${a.author} approved "${a.title}" on the review page and clicked "Approve & build". Build it now as a draft in the client's email platform (push_to_klaviyo, or push_to_customerio for Customer.io clients) with design folder ${a.designPath} and the audiences in its copy file. Reply in one or two lines with the result.`;
  const key = `${channel}:${threadTs}`;
  for (let i = 0; busy.has(key) && i < 60; i++) await new Promise((r) => setTimeout(r, 10_000)); // wait for a job already running in this thread
  busy.add(key);
  try {
    await run(client, { channel, threadTs, team: TEAM_ID, request, names: await foreignNames(CLIENTS_DIR, client.folder, db()), ts: posted.ts!, inThread: false });
  } catch (e: any) { console.error("[review]", e.message); }
  finally {
    busy.delete(key);
    if (a.kind === "comments") await db().from("design_reviews").update({ working_since: null }).eq("id", a.reviewId);
    else {
      const { data: last } = await db().from("slack_audit").select("outcome").eq("channel_id", channel).eq("thread_ts", threadTs).order("at", { ascending: false }).limit(1).maybeSingle();
      const state = last?.outcome === "ran" ? "built" : "failed";
      if (a.kind === "build_flow") await db().from("design_reviews").update({ build_state: state }).eq("client_id", a.clientId).eq("build_state", "queued");
      else await db().from("design_reviews").update({ build_state: state }).eq("id", a.reviewId);
    }
  }
}

// ── Proactive posts (weekly report, weekly win): the agent writes it, it's leak-checked, then posted top-level.
// Replies in its thread continue the same conversation. "SKIP" from the agent = nothing worth posting.
async function proactiveAgentPost(c: ProactiveClient, channel: string, prompt: string, kind: string) {
  await pullLatest();
  const res = await runAgent({ folder: c.folder, clientId: c.id, clientName: c.name, prompt, onProgress: () => {} });
  const text = (res.text ?? "").trim();
  await saveClientFolder(c.folder, `${c.folder}: proactive ${kind}`);
  if (res.error || !text || /^SKIP\b/.test(text)) {
    await audit({ team_id: TEAM_ID, channel_id: channel, client_id: c.id, request: `proactive ${kind}`, outcome: res.error ? "error" : "ran", reason: res.error ?? "skipped: nothing worth posting", cost_usd: res.costUsd });
    return { skipped: true, cost: res.costUsd, note: res.error ?? "nothing worth posting" };
  }
  const problems = scanText(text, await foreignNames(CLIENTS_DIR, c.folder, db()));
  if (problems.length) {
    await audit({ team_id: TEAM_ID, channel_id: channel, client_id: c.id, request: `proactive ${kind}`, outcome: "blocked_output", reason: problems.join("; ").slice(0, 2000), cost_usd: res.costUsd });
    return { skipped: true, cost: res.costUsd, note: "held back by the safety check" };
  }
  const parts = chunks(toSlack(text));
  const head = await app.client.chat.postMessage({ channel, text: parts[0] });
  for (const p of parts.slice(1)) await app.client.chat.postMessage({ channel, thread_ts: head.ts!, text: p });
  await saveThread(channel, head.ts!, c.id, res.sessionId);
  await audit({ team_id: TEAM_ID, channel_id: channel, thread_ts: head.ts!, client_id: c.id, request: `proactive ${kind}`, outcome: "ran", cost_usd: res.costUsd });
  return { ts: head.ts!, skipped: false, cost: res.costUsd };
}

// An onboarding still marked "running" when the bot starts was cut off by a restart (a deploy or a crash):
// start it again from the top, once per client. Runs are idempotent (they rewrite the same files).
async function resumeOnboardings() {
  try {
    const { data } = await db().from("onboarding_runs").select("id, client_id, created_at, clients(name, folder)").eq("status", "running").order("created_at", { ascending: false });
    const seen = new Set<string>();
    for (const r of (data ?? []) as any[]) {
      if (seen.has(r.client_id)) { await db().from("onboarding_runs").update({ status: "superseded", updated_at: new Date().toISOString() }).eq("id", r.id); continue; }
      seen.add(r.client_id);
      const folder = r.clients?.folder, name = r.clients?.name;
      if (!folder || !name) continue;
      const setup = join(CLIENTS_DIR, folder, "onboarding", "internal-setup.md");
      const internal = existsSync(setup);
      const platform = internal ? readFileSync(setup, "utf8").match(/^Email platform:\s*(.+)$/m)?.[1] ?? "not given" : "see the form";
      await db().from("onboarding_runs").update({ status: "waiting_for_form", updated_at: new Date().toISOString() }).eq("id", r.id);
      const { data: ch } = await db().from("slack_channels").select("channel_id").eq("client_id", r.client_id).limit(1).maybeSingle();
      if (ch) await app.client.chat.postMessage({ channel: ch.channel_id, text: `The ${name} onboarding was interrupted by a restart, so I'm starting it again now.` }).catch(() => {});
      console.log(`[onboard] resuming ${name}`);
      runOnboarding({ clientId: r.client_id, folder, name, klaviyo: platform, internal }).catch((e) => console.error("[onboard]", e));
    }
  } catch (e: any) { console.error("[onboard] resume failed:", e.message); }
}

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
  startWeb(async (channel, thread, text) => { await app.client.chat.postMessage({ channel, thread_ts: thread ?? undefined, text }); },
    (f) => { runOnboarding(f).catch((e) => console.error("[onboard]", e)); },
    (a) => { reviewAction(a).catch((e) => console.error("[review]", e)); });
  resumeOnboardings();
  syncStale();
  setInterval(syncStale, 3 * 3600_000);
  const proactive = () => proactiveTick({ post: async (ch, text) => (await app.client.chat.postMessage({ channel: ch, text })).ts, agentPost: proactiveAgentPost }).catch((e) => console.error("[proactive]", e.message));
  setTimeout(proactive, 60_000);
  setInterval(proactive, 15 * 60_000);
  watchForCodeUpdates(() => busy.size === 0 && onboardingActive.size === 0);
})();
