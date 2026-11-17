import { ago } from "@/lib/format";
import { currentPlan, planSends } from "@/lib/strategy/data";
import { AutoRefresh, PlanActions, PlanForm } from "./PlanControls";

// The month's plan in one bar: start it, watch it, approve it. The sends themselves live on the calendar.

export async function PlanBar({ clientId, month, monthLabel }: { clientId: string; month: string; monthLabel: string }) {
  const plan = await currentPlan(clientId, `${month}-01`);

  if (!plan || plan.status === "failed") {
    return (
      <section className="card plan-bar">
        <h2 style={{ fontSize: 17 }}>No plan for {monthLabel} yet</h2>
        {plan?.status === "failed" && <div className="notice notice--bad" style={{ marginTop: 10 }}>The last attempt didn&apos;t finish: {plan.error}</div>}
        <PlanForm clientId={clientId} month={month} monthLabel={monthLabel} defaults={{ emails: plan?.inputs.emails ?? 12, sms: plan?.inputs.sms ?? 5 }} />
      </section>
    );
  }

  if (plan.status === "generating") {
    return (
      <section className="card plan-bar">
        <AutoRefresh />
        <div className="plan-bar-row">
          <div>
            <h2 style={{ fontSize: 17 }}>Planning {monthLabel}…</h2>
            <p className="small muted" style={{ margin: "2px 0 0" }}>
              {plan.inputs.emails} emails and {plan.inputs.sms} SMS · usually a few minutes · started {ago(plan.created_at)}
            </p>
          </div>
          <div className="bar" style={{ width: 220 }}><div className="bar-indeterminate" /></div>
        </div>
      </section>
    );
  }

  const sends = await planSends(plan.id);
  const questions = plan.result?.open_questions ?? [];
  const checks = plan.result?.checks ?? [];
  return (
    <section className="card plan-bar">
      <div className="plan-bar-row">
        <div className="plan-bar-status">
          <span className={plan.status === "approved" ? "chip chip--good" : "chip chip--warn"}>{plan.status === "approved" ? "Approved" : "Proposed"}</span>
          <span>
            <b>{monthLabel}</b>
            <span className="muted"> · {sends.filter((s) => s.channel === "email").length} emails · {sends.filter((s) => s.channel === "sms").length} SMS · {plan.status === "approved" ? `approved ${ago(plan.approved_at)}` : `written ${ago(plan.finished_at)}`}</span>
          </span>
        </div>
        <PlanActions planId={plan.id} canApprove={plan.status === "proposed"} />
      </div>
      {checks.length > 0 && <div className="notice notice--warn small" style={{ marginTop: 10 }}>{checks.join(" ")}</div>}
      {questions.length > 0 && (
        <details className="plan-questions">
          <summary>Needs an answer from the team · {questions.length}</summary>
          <ul>{questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
        </details>
      )}
    </section>
  );
}
