import Link from "next/link";
import { getStore } from "@/lib/store";
import { currentStaff } from "@/lib/auth/staff";
import { CreateClient } from "../LinkTools";
import { clientSummary, STATUS_LABEL, statusChip } from "../summary";

// All clients: onboarding progress and connections across the agency, and where new clients are created.
export default async function Clients() {
  const staff = await currentStaff();
  const clients = await getStore().listClients();
  const rows = await Promise.all(clients.map(clientSummary));
  const conn = (r: (typeof rows)[number], p: "klaviyo" | "shopify") => r.connections.find((c) => c.provider === p && c.status === "connected");
  return (
    <>
    <header className="topbar">
      <Link href="/admin" className="brandmark" style={{ color: "inherit", textDecoration: "none" }}>
        Fluid Creatives <span>· All clients</span>
      </Link>
      <span className="small muted">{staff?.email}</span>
    </header>
    <main className="wrap" style={{ paddingTop: 8 }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Clients</h1>
      <p className="muted" style={{ margin: "0 0 20px" }}>
        {rows.length} client{rows.length === 1 ? "" : "s"} · {rows.filter((r) => r.client.onboarding_status === "submitted").length} finished onboarding
      </p>

      <div className="card" style={{ padding: 0 }}>
        {rows.length === 0 ? (
          <p className="muted" style={{ padding: 24, margin: 0 }}>No clients yet. Create the first one below.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Onboarding</th>
                  <th>Progress</th>
                  <th>Klaviyo</th>
                  <th>Shopify</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.client.id}>
                    <td>
                      <Link className="row-link" href={`/admin/c/${r.client.id}`}>{r.client.name}</Link>
                      <div className="small muted">{r.client.contact_email ?? r.client.website_url ?? ""}</div>
                    </td>
                    <td><span className={statusChip(r.client.onboarding_status)}>{STATUS_LABEL[r.client.onboarding_status]}</span></td>
                    <td>
                      <div className="bar"><div style={{ width: `${r.progress.percent}%` }} /></div>
                      <div className="small muted" style={{ marginTop: 4 }}>
                        {r.progress.percent}%{r.progress.requiredMissing.length ? ` · ${r.progress.requiredMissing.length} required left` : ""}
                      </div>
                    </td>
                    <td>{conn(r, "klaviyo") ? <span className="chip chip--good">Connected</span> : <span className="chip">Not yet</span>}</td>
                    <td>{conn(r, "shopify") ? <span className="chip chip--good">Connected</span> : <span className="chip">Not yet</span>}</td>
                    <td className="small muted">{new Date(r.client.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, maxWidth: 640 }}>
        <CreateClient />
      </div>
    </main>
    </>
  );
}
