"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { approvePlanAction, planMonthAction, regeneratePlanAction, regenerateSendAction, rejectPlanAction, undoSendAction, type ActionResult } from "../plan-actions";

export function PlanForm({ clientId, month, monthLabel, defaults }: { clientId: string; month: string; monthLabel: string; defaults: { emails: number; sms: number } }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(planMonthAction.bind(null, clientId), null);
  return (
    <form action={action} className="plan-form">
      <input type="hidden" name="month" value={month} />
      <div className="plan-form-row">
        <label className="field">
          <span className="label">Emails</span>
          <input name="emails" type="number" min={0} max={40} defaultValue={defaults.emails} className="input" />
        </label>
        <label className="field">
          <span className="label">SMS</span>
          <input name="sms" type="number" min={0} max={40} defaultValue={defaults.sms} className="input" />
        </label>
      </div>
      <label className="field">
        <span className="label">Sales, launches or dates to plan around</span>
        <span className="help">Holidays are added automatically. e.g. &ldquo;BFCM: 25% sitewide Nov 27-Dec 1, code BF25. New cacao blend launches Nov 10.&rdquo;</span>
        <textarea name="notes" className="textarea" placeholder="Anything the strategist should know about this month" />
      </label>
      <button className="btn" disabled={pending}>{pending ? "Starting…" : `Plan ${monthLabel}`}</button>
      {state?.ok === false && <div className="notice notice--bad" style={{ marginTop: 10 }}>{state.error}</div>}
    </form>
  );
}

/** Refreshes the page while the strategist is working. */
export function AutoRefresh({ every = 8000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}

export function PlanActions({ planId, canApprove }: { planId: string; canApprove: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState("");
  const [showRedo, setShowRedo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  return (
    <div className="plan-actions">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {canApprove && (
          <button className="btn" disabled={pending} onClick={() => run(() => approvePlanAction(planId))}>
            Approve plan → pipeline
          </button>
        )}
        <button className="btn btn--ghost" disabled={pending} onClick={() => setShowRedo((s) => !s)}>
          Redo the month
        </button>
        {canApprove && (
          <button className="btn btn--ghost" disabled={pending} onClick={() => run(() => rejectPlanAction(planId))}>
            Reject
          </button>
        )}
      </div>
      {showRedo && (
        <div style={{ marginTop: 12 }}>
          <textarea className="textarea" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What should change across the month? e.g. fewer promos before Black Friday, more SMS in the BFCM week" />
          <button className="btn" style={{ marginTop: 8 }} disabled={pending || !feedback.trim()} onClick={() => run(() => regeneratePlanAction(planId, feedback))}>
            {pending ? "Starting…" : "Write a new version"}
          </button>
        </div>
      )}
      {error && <div className="notice notice--bad" style={{ marginTop: 10 }}>{error}</div>}
    </div>
  );
}

/** Rewrite one send with feedback, or put back the previous version. */
export function SendEditor({ sendId, versions }: { sendId: string; versions: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error);
      else after?.();
      router.refresh();
    });
  return (
    <div className="send-editor">
      <label className="field">
        <span className="label">Regenerate this send</span>
        <textarea
          className="textarea"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          disabled={pending}
          placeholder="What should change? e.g. make it a founder note, send it to lapsed buyers, move it to the 14th, no discount"
        />
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn" disabled={pending || !feedback.trim()} onClick={() => run(() => regenerateSendAction(sendId, feedback), () => setFeedback(""))}>
          {pending ? "Rewriting… about a minute" : "Regenerate"}
        </button>
        {versions > 0 && (
          <button className="btn btn--ghost" disabled={pending} onClick={() => run(() => undoSendAction(sendId))}>
            Undo last change
          </button>
        )}
      </div>
      {error && <div className="notice notice--bad" style={{ marginTop: 10 }}>{error}</div>}
    </div>
  );
}

/** Esc closes the send drawer. */
export function CloseOnEscape({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.push(href, { scroll: false });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, href]);
  return null;
}
