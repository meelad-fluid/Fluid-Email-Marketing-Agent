import { count, money, pct, shortDate } from "@/lib/format";
import { rates, sentCampaigns, sumStats, type Range } from "@/lib/klaviyo/data";
import { RevenueColumns } from "./RevenueColumns";
import { StatTiles } from "./StatTiles";

// Home → Emails / SMS: KPI row, revenue per campaign, and every sent campaign in the range.
export async function ChannelView({ clientId, channel, range, tz }: { clientId: string; channel: "email" | "sms"; range: Range; tz: string }) {
  const list = await sentCampaigns(clientId, channel, range);
  const total = sumStats(list.map((c) => c.stats));
  const r = rates(total);
  const isEmail = channel === "email";

  const tiles = [
    { label: "Revenue", value: money(total.conversion_value), note: `${count(total.conversions)} attributed orders` },
    { label: "Campaigns sent", value: count(list.length), note: `${count(total.recipients, true)} recipients` },
    ...(isEmail ? [{ label: "Open rate", value: pct(r.openRate), note: "unique opens ÷ delivered" }] : []),
    { label: "Click rate", value: pct(r.clickRate, 2), note: "unique clicks ÷ delivered" },
    { label: "Revenue per recipient", value: money(r.rpr), note: `order rate ${pct(r.orderRate, 2)}` },
    { label: isEmail ? "Unsubscribe rate" : "Opt-out rate", value: pct(r.unsubRate, 2), note: `${count(total.spam_complaints)} spam complaints` },
  ];

  const oldestFirst = [...list].reverse();
  return (
    <>
      <StatTiles tiles={tiles} />
      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 17 }}>{isEmail ? "Email" : "SMS"} revenue per campaign</h2>
        <p className="intro small" style={{ margin: "2px 0 14px" }}>Each column is one send, oldest to newest. Hover or tab to a column for its details.</p>
        <RevenueColumns
          channel={channel}
          columns={oldestFirst.map((c) => ({ id: c.campaign_id, name: c.name, date: c.send_time!, dateLabel: shortDate(c.send_time, tz), revenue: c.stats?.conversion_value ?? 0, recipients: c.stats?.recipients ?? 0 }))}
        />
      </section>
      <section className="card" style={{ padding: 0, marginTop: 16 }}>
        <div className="table-scroll">
          <table className="table num">
            <thead>
              <tr>
                <th>Sent</th>
                <th>Campaign</th>
                <th>Recipients</th>
                {isEmail && <th>Open</th>}
                <th>Click</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>RPR</th>
                <th>{isEmail ? "Unsub" : "Opt-out"}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const cr = c.stats ? rates(c.stats) : null;
                return (
                  <tr key={c.campaign_id}>
                    <td className="nowrap">{shortDate(c.send_time, tz)}</td>
                    <td className="wide">
                      <div style={{ fontWeight: 600 }}>{isEmail ? c.subject ?? c.name : c.name}</div>
                      <div className="small muted clamp">{isEmail ? c.preview_text || c.name : c.sms_body}</div>
                    </td>
                    <td>{count(c.stats?.recipients)}</td>
                    {isEmail && <td>{pct(cr?.openRate)}</td>}
                    <td>{pct(cr?.clickRate, 2)}</td>
                    <td>{count(c.stats?.conversions)}</td>
                    <td>{money(c.stats?.conversion_value)}</td>
                    <td>{money(cr?.rpr)}</td>
                    <td>{pct(cr?.unsubRate, 2)}</td>
                  </tr>
                );
              })}
              {!list.length && (
                <tr>
                  <td colSpan={9} className="muted">No sent {isEmail ? "email" : "SMS"} campaigns in {range.preset ? `the ${range.label}` : range.label}.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
