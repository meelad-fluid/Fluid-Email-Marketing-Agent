import { notFound } from "next/navigation";
import { currentStaff } from "@/lib/auth/staff";
import { ago } from "@/lib/format";
import { lastSync } from "@/lib/klaviyo/data";
import { getStore } from "@/lib/store";
import { ClientSwitcher } from "../../components/ClientSwitcher";
import { SideNav } from "../../components/SideNav";
import { SyncButton } from "../../components/SyncButton";

// One client's workspace: client switcher top-left, sidebar navigation, Klaviyo sync status top-right.
export default async function Workspace({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const [client, clients, staff, connections] = await Promise.all([store.getClient(id), store.listClients(), currentStaff(), store.listConnections(id)]);
  if (!client) notFound();
  const klaviyo = connections.some((c) => c.provider === "klaviyo" && c.status === "connected");
  const sync = store.mode === "supabase" && klaviyo ? await lastSync(id) : null;
  const syncLabel = !sync ? "Klaviyo not synced yet" : sync.status === "failed" ? `Last sync failed ${ago(sync.started_at)}` : sync.status === "running" ? "Sync in progress" : `Klaviyo synced ${ago(sync.finished_at)}`;

  return (
    <div className="shell">
      <aside className="sidebar">
        <ClientSwitcher current={{ id: client.id, name: client.name }} clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
        <SideNav clientId={id} />
        <div className="sidebar-foot small muted">Fluid Creatives</div>
      </aside>
      <div className="main">
        <header className="mainbar">
          <div className="small muted mainbar-site">{client.website_url?.replace(/^https?:\/\//, "") ?? ""}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {klaviyo ? <SyncButton clientId={id} label={syncLabel} /> : <span className="small muted">Klaviyo not connected</span>}
            <span className="small muted mainbar-user">{staff?.email}</span>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
