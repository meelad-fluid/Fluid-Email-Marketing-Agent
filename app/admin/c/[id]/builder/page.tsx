import Link from "next/link";
import { pipelineSends } from "@/lib/strategy/data";

// Campaign builder: each approved send from the strategist's plan, built end to end by the brain.
// The brief is already written; copy, design, review and the Klaviyo build follow.

const STEPS = [
  { key: "brief", title: "Brief", skill: "Strategist", does: "Written from this client's Klaviyo results when the month was planned." },
  { key: "copy", title: "Copy", skill: "Copywriter", does: "Subject, preview and every block of the template in the client's voice, plus the SMS." },
  { key: "design", title: "Design", skill: "Email designer", does: "Fluid's template for this campaign type, in the client's brand, checked against the design rules." },
  { key: "review", title: "Review", skill: "Approvals", does: "Fluid review, then the client approves. Nothing sends without it." },
  { key: "build", title: "Build in Klaviyo", skill: "Klaviyo builder", does: "Sliced images, links and alt text uploaded; scheduled once approved." },
];

const AUDIENCE: Record<string, string> = { engaged: "Engaged", non_buyers: "Non-buyers", lapsed: "Lapsed", vip: "VIP", other: "Other" };

export default async function Builder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ send?: string }> }) {
  const { id } = await params;
  const wanted = (await searchParams).send;
  const sends = await pipelineSends(id).catch(() => []);
  const selected = sends.find((s) => s.id === wanted) ?? sends[0];

  return (
    <>
      <h1 className="page-title">Campaign builder</h1>
      <p className="page-sub">Every approved send from the plan, built by the brain: brief → copy → design → review → Klaviyo.</p>

      {!sends.length ? (
        <section className="card">
          <h2 style={{ fontSize: 17 }}>Nothing to build yet</h2>
          <p className="muted" style={{ margin: "6px 0 14px" }}>The builder works from the strategist&apos;s approved plan. Plan and approve a month first, and its sends appear here with their briefs already written.</p>
          <Link className="btn" href={`/admin/c/${id}/calendar`}>Go to Calendar &amp; pipeline</Link>
        </section>
      ) : (
        <div className="builder">
          <section className="card" style={{ padding: 0 }}>
            <div style={{ padding: "16px 18px 6px" }}>
              <h2 style={{ fontSize: 17 }}>Sends to build · {sends.length}</h2>
            </div>
            <ul className="build-list">
              {sends.map((s) => (
                <li key={s.id}>
                  <Link href={`?send=${s.id}`} className={s.id === selected?.id ? "active" : ""}>
                    <i className={`viz-key viz-key--${s.channel}`} />
                    <span>
                      <b>{new Date(`${s.send_date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</b>
                      <span className="small muted"> · {s.stage === "brief" ? "brief ready" : s.stage}</span>
                      <div className="small">{s.name ?? s.topic}</div>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {selected && (
            <section className="card">
              <ol className="stepper" aria-label="Steps">
                {STEPS.map((st, i) => (
                  <li key={st.key} className={i === 0 ? "done" : i === 1 ? "current" : ""}>
                    <span className="step-n">{i === 0 ? "✓" : i + 1}</span>
                    <b>{st.title}</b>
                  </li>
                ))}
              </ol>
              <h2 style={{ fontSize: 19 }}>{selected.name ?? selected.topic}</h2>
              <dl className="brief" style={{ padding: "12px 0 0" }}>
                <dt>Angle</dt><dd>{selected.angle}</dd>
                {selected.name && (<><dt>Message</dt><dd>{selected.topic}</dd></>)}
                <dt>Channel</dt><dd>{selected.channel === "email" ? "Email" : "SMS"} · {selected.format.replace("_", " ")}</dd>
                <dt>Sent to</dt><dd>{selected.segment} ({AUDIENCE[selected.audience] ?? selected.audience})</dd>
                <dt>Goal</dt><dd>{selected.goal}</dd>
                {selected.offer && (<><dt>Offer</dt><dd>{selected.offer}</dd></>)}
              </dl>
              <div className="next-step">
                <div>
                  <b>Next: copy</b>
                  <div className="small muted">The copywriter writes this send in the client&apos;s voice, to the blocks of Fluid&apos;s template.</div>
                </div>
                <button className="btn" disabled title="The copywriter agent is the next piece being connected">Write copy</button>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
