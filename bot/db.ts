// Supabase access for the bot (service key, this process only). Every lookup starts from the Slack
// channel id, so a channel can only ever resolve to the one client it is linked to.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import "./config";

let client: SupabaseClient | null = null;
export function db(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase isn't configured in .env.local");
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export type LinkedClient = { id: string; name: string; folder: string };

export async function clientForChannel(channelId: string, teamId: string): Promise<LinkedClient | null> {
  const { data, error } = await db().from("slack_channels").select("team_id, clients(id, name, folder)").eq("channel_id", channelId).maybeSingle();
  if (error) throw error;
  const c = (data as any)?.clients;
  if (!data || data.team_id !== teamId || !c?.folder) return null;
  return { id: c.id, name: c.name, folder: c.folder };
}

export async function linkChannel(channelId: string, teamId: string, folder: string, name: string, by: string): Promise<LinkedClient> {
  let { data: c } = await db().from("clients").select("id, name, folder").eq("folder", folder).maybeSingle();
  if (!c) {
    const ins = await db().from("clients").insert({ name, slug: folder, folder }).select("id, name, folder").single();
    if (ins.error) throw ins.error;
    c = ins.data;
  }
  const { error } = await db().from("slack_channels").upsert({ channel_id: channelId, client_id: c!.id, team_id: teamId, linked_by: by, linked_at: new Date().toISOString() });
  if (error) throw error;
  // A relinked channel must not carry conversations from its previous client.
  await db().from("slack_threads").delete().eq("channel_id", channelId).neq("client_id", c!.id);
  return c as LinkedClient;
}

export async function unlinkChannel(channelId: string) {
  const { error } = await db().from("slack_channels").delete().eq("channel_id", channelId);
  if (error) throw error;
}

export async function threadSession(channelId: string, threadTs: string, clientId: string): Promise<string | undefined> {
  const { data } = await db().from("slack_threads").select("session_id, client_id").eq("channel_id", channelId).eq("thread_ts", threadTs).maybeSingle();
  return data && data.client_id === clientId ? data.session_id ?? undefined : undefined;
}

export async function saveThread(channelId: string, threadTs: string, clientId: string, sessionId?: string) {
  await db().from("slack_threads").upsert({ channel_id: channelId, thread_ts: threadTs, client_id: clientId, session_id: sessionId ?? null, updated_at: new Date().toISOString() });
}

export async function isBotThread(channelId: string, threadTs: string) {
  const { data } = await db().from("slack_threads").select("thread_ts").eq("channel_id", channelId).eq("thread_ts", threadTs).maybeSingle();
  return !!data;
}

export async function audit(row: { team_id?: string; channel_id?: string; thread_ts?: string; user_id?: string; client_id?: string | null; request?: string; outcome: string; reason?: string; cost_usd?: number }) {
  const { error } = await db().from("slack_audit").insert({ ...row, request: row.request?.slice(0, 4000) });
  if (error) console.error("audit failed:", error.message);
}
