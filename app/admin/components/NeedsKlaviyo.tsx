import { lastSync } from "@/lib/klaviyo/data";
import { getStore } from "@/lib/store";

// Shown instead of a data tab when there's nothing to show yet. Returns null when data is ready.
export async function NeedsKlaviyo(clientId: string) {
  const store = getStore();
  if (store.mode !== "supabase") return <div className="card muted">Klaviyo data needs Supabase connected.</div>;
  const connected = (await store.listConnections(clientId)).some((c) => c.provider === "klaviyo" && c.status === "connected");
  if (!connected) return <div className="card muted">This client hasn&apos;t connected Klaviyo yet. Once they connect it through their onboarding link, sync it from here.</div>;
  const sync = await lastSync(clientId);
  if (!sync || (sync.status !== "ok" && !sync.finished_at)) return <div className="card muted">Klaviyo is connected but hasn&apos;t been synced yet. Click <b>Sync now</b> at the top right.</div>;
  return null;
}
