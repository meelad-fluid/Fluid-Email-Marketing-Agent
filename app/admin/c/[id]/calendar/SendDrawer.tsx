import Link from "next/link";
import { plannedSend } from "@/lib/strategy/data";
import { AUDIENCE_LABEL, FORMAT_LABEL, TYPE_LABEL } from "@/lib/strategy/labels";
import { CloseOnEscape, SendEditor } from "../../../components/PlanControls";

// One planned send's brief, opened from the calendar, with rewrite-with-feedback.

export async function SendDrawer({ clientId, sendId, closeHref }: { clientId: string; sendId: string; closeHref: string }) {
  const s = await plannedSend(clientId, sendId);
  if (!s) return null;
  const date = new Date(`${s.send_date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  const editable = ["proposed", "approved"].includes(s.plan_status) && s.stage === "brief";
  return (
    <>
      <CloseOnEscape href={closeHref} />
      <aside className="drawer" aria-label="Send brief" key={s.id}>
        <div className="drawer-head">
          <div>
            <div className="small muted">
              <i className={`viz-key viz-key--${s.channel}`} /> {s.channel === "email" ? "Email" : "SMS"} · {date}
              {s.send_time ? ` · ${s.send_time}` : ""}
            </div>
            <h2 className="drawer-title">{s.name ?? s.topic}</h2>
          </div>
          <Link href={closeHref} scroll={false} className="btn btn--ghost btn--small" aria-label="Close">✕</Link>
        </div>

        <dl className="brief">
          <dt>Message</dt><dd>{s.topic}</dd>
          <dt>Angle</dt><dd>{s.angle}</dd>
          <dt>Sent to</dt><dd>{s.segment} <span className="muted">({AUDIENCE_LABEL[s.audience] ?? s.audience})</span></dd>
          <dt>Goal</dt><dd>{s.goal}</dd>
          <dt>Type</dt><dd>{TYPE_LABEL[s.campaign_type] ?? s.campaign_type}{s.channel === "email" ? ` · ${FORMAT_LABEL[s.format]}` : ""}</dd>
          <dt>Offer</dt><dd>{s.offer ?? <span className="muted">No offer</span>}</dd>
          {s.test && (<><dt>Test</dt><dd>{s.test}</dd></>)}
        </dl>

        {editable ? (
          <SendEditor sendId={s.id} versions={s.revisions?.length ?? 0} />
        ) : (
          <p className="small muted" style={{ marginTop: 16 }}>This send is in production, so its brief is locked.</p>
        )}
      </aside>
    </>
  );
}
