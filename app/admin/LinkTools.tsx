"use client";

import { useActionState, useState, useTransition } from "react";
import { createClientAction, newLinkAction, type LinkResult } from "./actions";

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="linkbox">
        <code>{link}</code>
        <button
          type="button"
          className="btn btn--small"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <p className="small muted" style={{ margin: "6px 0 0" }}>
        Send this to the client. For security it&apos;s only shown now; if it&apos;s lost, make a new one from the client&apos;s page.
      </p>
    </div>
  );
}

export function CreateClient() {
  const [state, action, pending] = useActionState<LinkResult, FormData>(createClientAction, null);
  return (
    <div className="card">
      <h2>New client</h2>
      <p className="intro">Creates their workspace and an onboarding link to send them.</p>
      <form action={action}>
        <div className="grid-2">
          <div>
            <label className="label" htmlFor="name">Brand name</label>
            <input id="name" name="name" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="website">Website</label>
            <input id="website" name="website" className="input" placeholder="brand.com" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="label" htmlFor="email">Client email</label>
          <input id="email" name="email" type="email" className="input" />
        </div>
        <button className="btn" style={{ marginTop: 16 }} disabled={pending}>
          {pending ? "Creating…" : "Create client + onboarding link"}
        </button>
      </form>
      {state?.ok === false && <div className="notice notice--bad" style={{ marginTop: 12 }}>{state.error}</div>}
      {state?.ok && (
        <div style={{ marginTop: 16 }}>
          <CopyLink link={state.link} />
        </div>
      )}
    </div>
  );
}

export function NewLink({ clientId, hasActive }: { clientId: string; hasActive: boolean }) {
  const [result, setResult] = useState<LinkResult>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      {result?.ok ? (
        <CopyLink link={result.link} />
      ) : (
        <>
          <p className="small muted" style={{ margin: "0 0 10px" }}>
            {hasActive ? "An onboarding link is active. Making a new one stops the old link working." : "No active onboarding link."}
          </p>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            disabled={pending}
            onClick={() => start(async () => setResult(await newLinkAction(clientId)))}
          >
            {pending ? "Creating…" : hasActive ? "Replace onboarding link" : "Create onboarding link"}
          </button>
        </>
      )}
      {result?.ok === false && <div className="field-error">{result.error}</div>}
    </div>
  );
}
