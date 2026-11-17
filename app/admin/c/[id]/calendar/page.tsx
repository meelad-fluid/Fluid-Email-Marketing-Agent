import { pipelineSends, type PlannedSend } from "@/lib/strategy/data";
import { NeedsKlaviyo } from "../../../components/NeedsKlaviyo";
import { PlanBar } from "../../../components/PlanBar";
import { CalendarMonth } from "./CalendarMonth";
import { SendDrawer } from "./SendDrawer";

// Campaign calendar & pipeline: the month on a calendar (Klaviyo's sends plus the strategist's
// planned ones, each opening its brief), the plan's status, and the sends in production.

// Plans are started from this page and keep running after it responds (about 7 minutes for a month),
// so allow the full time on Vercel.
export const maxDuration = 800;

const STAGES = [
  { key: "brief", label: "Brief", note: "Planned by the strategist" },
  { key: "copy", label: "Copy", note: "Being written" },
  { key: "design", label: "Design", note: "Being designed" },
  { key: "internal_review", label: "Fluid review", note: "Checked by the team" },
  { key: "client_review", label: "Client review", note: "Waiting on the client" },
  { key: "approved", label: "Approved", note: "Ready to build" },
  { key: "scheduled", label: "Scheduled", note: "Built in Klaviyo" },
];

const nextMonth = () => {
  const d = new Date();
  const n = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}`;
};

export default async function CalendarAndPipeline({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string; send?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : nextMonth();
  const monthLabel = new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const gate = await NeedsKlaviyo(id);
  const inProduction = gate ? [] : await pipelineSends(id);
  const byStage = new Map<string, PlannedSend[]>();
  for (const s of inProduction) byStage.set(s.stage, [...(byStage.get(s.stage) ?? []), s]);

  return (
    <>
      <h1 className="page-title">Campaign calendar & pipeline</h1>
      <p className="page-sub">Click any planned send to see its brief or regenerate it.</p>

      {gate ?? <PlanBar clientId={id} month={month} monthLabel={monthLabel} />}
      {gate ?? <CalendarMonth id={id} month={month} selected={sp.send} />}
      {!gate && sp.send && /^[0-9a-f-]{36}$/.test(sp.send) && <SendDrawer clientId={id} sendId={sp.send} closeHref={`/admin/c/${id}/calendar?month=${month}`} />}

      <section className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
          <h2 style={{ fontSize: 17 }}>Pipeline</h2>
          <span className="small muted">{inProduction.length ? `${inProduction.length} sends in production` : "Fills when a plan is approved"}</span>
        </div>
        <div className="pipeline">
          {STAGES.map((st) => {
            const items = byStage.get(st.key) ?? [];
            return (
              <div className="stage" key={st.key}>
                <div className="stage-head">
                  <span>{st.label}</span>
                  <span className="stage-count">{items.length}</span>
                </div>
                <div className="stage-note">{st.note}</div>
                {items.length ? (
                  <div className="pcard-list">
                    {items.slice(0, 8).map((s) => (
                      <div className="pcard-mini" key={s.id} title={s.topic}>
                        <i className={`viz-key viz-key--${s.channel}`} />
                        <span>
                          <b>{new Date(`${s.send_date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</b> {s.name ?? s.topic}
                        </span>
                      </div>
                    ))}
                    {items.length > 8 && <div className="small muted">+{items.length - 8} more</div>}
                  </div>
                ) : (
                  <div className="stage-empty" aria-hidden />
                )}
              </div>
            );
          })}
        </div>
      </section>

    </>
  );
}
