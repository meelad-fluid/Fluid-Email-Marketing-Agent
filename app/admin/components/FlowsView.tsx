import { count, money, pct } from "@/lib/format";
import { flowsWithStats, rates, sentCampaigns, sumStats } from "@/lib/klaviyo/data";
import { type Range } from "@/lib/klaviyo/data";
import { StatTiles } from "./StatTiles";

// Home → Flows: every non-archived flow with its email and SMS results for the chosen range.
export async function FlowsView({ clientId: id, range }: { clientId: string; range: Range }) {
  const [flows, emails, sms] = await Promise.all([flowsWithStats(id, range), sentCampaigns(id, "email", range), sentCampaigns(id, "sms", range)]);
  const rev = (f: (typeof flows)[number]) => (f.email?.conversion_value ?? 0) + (f.sms?.conversion_value ?? 0);
  flows.sort((a, b) => rev(b) - rev(a) || a.name.localeCompare(b.name));

  const emailTotal = sumStats(flows.map((f) => f.email));
  const smsTotal = sumStats(flows.map((f) => f.sms));
  const flowRevenue = emailTotal.conversion_value + smsTotal.conversion_value;
  const campaignRevenue = sumStats([...emails, ...sms].map((c) => c.stats)).conversion_value;
  const share = flowRevenue + campaignRevenue ? flowRevenue / (flowRevenue + campaignRevenue) : null;
  const live = flows.filter((f) => f.status === "live");
  const status = (s: string) => (s === "live" ? "chip chip--good" : s === "manual" ? "chip chip--warn" : "chip");

  return (
    <>
      <StatTiles
        tiles={[
          { label: "Flow revenue", value: money(flowRevenue), note: `${count(emailTotal.conversions + smsTotal.conversions)} attributed orders` },
          { label: "Email flows", value: money(emailTotal.conversion_value), note: `RPR ${money(rates(emailTotal).rpr)}` },
          { label: "SMS flows", value: money(smsTotal.conversion_value), note: `RPR ${money(rates(smsTotal).rpr)}` },
          { label: "Share of revenue from flows", value: pct(share, 0), note: `campaigns ${money(campaignRevenue)}` },
          { label: "Live flows", value: count(live.length), note: `${flows.length - live.length} draft or manual` },
        ]}
      />
      {flows.revenueOnly && <p className="small muted" style={{ margin: "12px 0 0" }}>For custom dates, flows show revenue and orders only. Recipients and rates are available for the last 30, 60 and 90 days.</p>}
      <section className="card" style={{ padding: 0, marginTop: 16 }}>
        <div className="table-scroll">
          <table className="table num">
            <thead>
              <tr>
                <th>Flow</th>
                <th>Status</th>
                <th>Email recipients</th>
                <th>Open</th>
                <th>Click</th>
                <th>Email revenue</th>
                <th>Email RPR</th>
                <th>SMS recipients</th>
                <th>SMS revenue</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((f) => {
                const er = f.email ? rates(f.email) : null;
                return (
                  <tr key={f.flow_id}>
                    <td className="wide">
                      <div style={{ fontWeight: 600 }}>{f.name}</div>
                      {f.trigger_type && <div className="small muted">Trigger: {f.trigger_type}</div>}
                    </td>
                    <td><span className={status(f.status)}>{f.status}</span></td>
                    <td>{count(f.email?.recipients)}</td>
                    <td>{pct(er?.openRate)}</td>
                    <td>{pct(er?.clickRate, 2)}</td>
                    <td>{money(f.email?.conversion_value)}</td>
                    <td>{money(er?.rpr)}</td>
                    <td>{count(f.sms?.recipients)}</td>
                    <td>{money(f.sms?.conversion_value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
