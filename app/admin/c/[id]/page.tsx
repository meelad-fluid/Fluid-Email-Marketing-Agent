import Link from "next/link";
import { count, money, pct, shortDate } from "@/lib/format";
import { attributedDaily, emailFlowTotals, flowsWithStats, parseRange, previousRange, rangeQuery, rates, sentCampaigns, storeRevenue, sumStats, upcomingCampaigns, type Campaign, type Range } from "@/lib/klaviyo/data";
import { clientTimeZone } from "@/lib/onboarding/timezone";
import { getStore } from "@/lib/store";
import { ChannelView } from "../../components/ChannelView";
import { FlowsView } from "../../components/FlowsView";
import { NeedsKlaviyo } from "../../components/NeedsKlaviyo";
import { RangeFilter } from "../../components/RangeFilter";
import { StatTiles } from "../../components/StatTiles";

// Home: the client's dashboard reports. Overview first; Emails, SMS and Flows go deeper.
const VIEWS = [
  { key: "overview", label: "Overview" },
  { key: "emails", label: "Emails" },
  { key: "sms", label: "SMS" },
  { key: "flows", label: "Flows" },
] as const;
type View = (typeof VIEWS)[number]["key"];

export default async function Home({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string; days?: string; from?: string; to?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const view: View = VIEWS.some((v) => v.key === sp.view) ? (sp.view as View) : "overview";
  const store = getStore();
  const [client, answers] = await Promise.all([store.getClient(id), store.getAnswers(id)]);
  const tz = clientTimeZone(answers.timezone);
  const range = parseRange(sp, tz);
  const base = `/admin/c/${id}`;
  const gate = await NeedsKlaviyo(id);

  return (
    <>
      <h1 className="page-title">{client!.name}</h1>
      <p className="page-sub">Email and SMS performance from Klaviyo.</p>
      {gate ?? (
        <>
          <nav className="subtabs" aria-label="Report">
            {VIEWS.map((v) => (
              <Link key={v.key} href={`${base}?${new URLSearchParams({ view: v.key, ...rangeQuery(range) })}`} className={v.key === view ? "tab active" : "tab"} aria-current={v.key === view ? "page" : undefined}>
                {v.label}
              </Link>
            ))}
          </nav>
          <RangeFilter base={base} current={range} query={{ view }} />
          {view === "overview" && <Overview clientId={id} range={range} tz={tz} base={base} />}
          {view === "emails" && <ChannelView clientId={id} channel="email" range={range} tz={tz} />}
          {view === "sms" && <ChannelView clientId={id} channel="sms" range={range} tz={tz} />}
          {view === "flows" && <FlowsView clientId={id} range={range} />}
        </>
      )}
    </>
  );
}

// The headline numbers for a window. Revenue is by the day the order came in (Klaviyo's attribution),
// so the tiles add up for any window. Revenue per recipient covers email campaigns and flows; custom
// windows have no flow recipients, so there it's campaigns only (in both periods, so they compare).
async function headline(clientId: string, range: Range, previous: boolean) {
  const [emails, daily, store, flows] = await Promise.all([
    sentCampaigns(clientId, "email", range),
    attributedDaily(clientId, range),
    storeRevenue(clientId, range),
    range.preset ? emailFlowTotals(clientId, range.preset, previous) : null,
  ]);
  const sum = (f: (d: (typeof daily)[number]) => boolean) => daily.filter(f).reduce((n, d) => n + d.revenue, 0);
  const email = sum((d) => d.channel === "email");
  const campaigns = sum((d) => d.channel === "email" && !d.flow_id);
  const campaignStats = sumStats(emails.map((c) => c.stats));
  return {
    store,
    email,
    campaigns,
    flows: email - campaigns,
    sms: sum((d) => d.channel === "sms"),
    emailsSent: emails.length,
    rpr: rates(flows ? sumStats([campaignStats, flows]) : campaignStats).rpr,
  };
}

async function Overview({ clientId, range, tz, base }: { clientId: string; range: Range; tz: string; base: string }) {
  const [now, before, emails, sms, flows, upcoming] = await Promise.all([
    headline(clientId, range, false),
    headline(clientId, previousRange(range), true),
    sentCampaigns(clientId, "email", range),
    sentCampaigns(clientId, "sms", range),
    flowsWithStats(clientId, range),
    upcomingCampaigns(clientId, 6),
  ]);
  const share = (n: number, of: number) => pct(of ? n / of : null, 0);
  const change = (a: number | null, b: number | null) => (a != null && b != null && Number.isFinite(b) && b > 0 ? a / b - 1 : null);
  const vs = `previous ${range.days} days`;

  // Two rankings, per Fluid's strategy doctrine: revenue shows scale, revenue per recipient shows which message worked.
  const withStats = [...emails, ...sms].filter((c) => c.stats && c.stats.delivered > 0);
  const byRevenue = [...withStats].sort((a, b) => b.stats!.conversion_value - a.stats!.conversion_value).slice(0, 5);
  const byRpr = [...withStats].filter((c) => c.stats!.delivered >= 500).sort((a, b) => rates(b.stats!).rpr! - rates(a.stats!).rpr!).slice(0, 5);
  const topFlows = [...flows].map((f) => ({ ...f, rev: (f.email?.conversion_value ?? 0) + (f.sms?.conversion_value ?? 0) })).sort((a, b) => b.rev - a.rev).slice(0, 5);
  const title = (c: Campaign) => (c.channel === "email" ? c.subject ?? c.name : c.name.replace(/^FC \| (SMS: )?/, ""));

  return (
    <>
      <StatTiles
        tiles={[
          { label: "Total revenue", value: money(now.store.revenue), change: change(now.store.revenue, before.store.revenue), vs, note: `${count(now.store.orders)} orders` },
          { label: "Email revenue", value: money(now.email), change: change(now.email, before.email), vs, note: `${share(now.email, now.store.revenue)} of total revenue${now.sms ? ` · SMS ${money(now.sms)}` : ""}` },
          { label: "Campaign revenue", value: money(now.campaigns), change: change(now.campaigns, before.campaigns), vs, note: `${share(now.campaigns, now.email)} of email · ${now.emailsSent} sent` },
          { label: "Flow revenue", value: money(now.flows), change: change(now.flows, before.flows), vs, note: `${share(now.flows, now.email)} of email` },
          { label: "Revenue per recipient", value: money(now.rpr), change: change(now.rpr, before.rpr), vs, note: range.preset ? "email campaigns + flows" : "email campaigns" },
        ]}
      />
      <div className="grid-2-wide" style={{ marginTop: 16 }}>
        <section className="card">
          <h2 style={{ fontSize: 17 }}>Top campaigns by revenue</h2>
          <p className="intro small" style={{ margin: "2px 0 8px" }}>What worked at scale.</p>
          <Ranked rows={byRevenue.map((c) => ({ key: c.campaign_id, label: title(c), sub: `${c.channel === "email" ? "Email" : "SMS"} · ${shortDate(c.send_time, tz)}`, value: money(c.stats!.conversion_value) }))} />
        </section>
        <section className="card">
          <h2 style={{ fontSize: 17 }}>Top campaigns by revenue per recipient</h2>
          <p className="intro small" style={{ margin: "2px 0 8px" }}>Which message actually worked (500+ delivered).</p>
          <Ranked rows={byRpr.map((c) => ({ key: c.campaign_id, label: title(c), sub: `${c.channel === "email" ? "Email" : "SMS"} · ${shortDate(c.send_time, tz)} · ${count(c.stats!.delivered)} delivered`, value: money(rates(c.stats!).rpr) }))} />
        </section>
        <section className="card">
          <h2 style={{ fontSize: 17 }}>Top flows</h2>
          <p className="intro small" style={{ margin: "2px 0 8px" }}>Email + SMS revenue. <Link href={`${base}?${new URLSearchParams({ view: "flows", ...rangeQuery(range) })}`}>All flows →</Link></p>
          <Ranked rows={topFlows.map((f) => ({ key: f.flow_id, label: f.name.replace(/^FC \| /, ""), sub: f.status, value: money(f.rev) }))} />
        </section>
        <section className="card">
          <h2 style={{ fontSize: 17 }}>Scheduled in Klaviyo</h2>
          <p className="intro small" style={{ margin: "2px 0 8px" }}>Next sends already scheduled. <Link href={`${base}/calendar`}>Calendar →</Link></p>
          {upcoming.length ? (
            <Ranked numbered={false} rows={upcoming.map((c) => ({ key: c.campaign_id, label: title(c), sub: c.channel === "email" ? "Email" : "SMS", value: shortDate(c.send_time, tz) }))} />
          ) : (
            <p className="small muted">Nothing scheduled in Klaviyo right now.</p>
          )}
        </section>
      </div>
    </>
  );
}

function Ranked({ rows, numbered = true }: { rows: { key: string; label: string; sub: string; value: string }[]; numbered?: boolean }) {
  if (!rows.length) return <p className="small muted">Nothing in this range.</p>;
  return (
    <table className="mini-table">
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.key}>
            {numbered && <td className="rank">{i + 1}</td>}
            <td>
              <div style={{ fontWeight: 600 }}>{r.label}</div>
              <div className="small muted">{r.sub}</div>
            </td>
            <td className="v">{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
