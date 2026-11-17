"use client";

import { createClient } from "@supabase/supabase-js";
import { useCallback, useMemo, useRef, useState } from "react";
import { SECTIONS, isAnswered, type AnswerValue, type Question } from "@/lib/onboarding/questions";

// The client onboarding form. Every field autosaves (on pause and on blur), so the client can leave
// and come back to the same link. Files upload straight to storage. Connection keys are checked
// on the server and never shown again after saving.

export type InitialAsset = { id: string; question_id: string | null; file_name: string | null; content_type: string | null; url: string };
type Conn = { provider: string; status: string; account_name: string | null };
type SaveState = "idle" | "saving" | "saved" | "error";

export function OnboardingForm(props: {
  token: string;
  clientName: string;
  submitted: boolean;
  initialAnswers: Record<string, AnswerValue>;
  initialAssets: InitialAsset[];
  initialConnections: Conn[];
  shopifyOAuth: boolean; // Fluid's Shopify app is set up: offer the install button
  shopifyNotice?: string; // result of a Shopify install, from the redirect back
}) {
  const api = `/api/onboard/${props.token}`;
  const [answers, setAnswers] = useState(props.initialAnswers);
  const [assets, setAssets] = useState(props.initialAssets);
  const [connections, setConnections] = useState(props.initialConnections);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitted, setSubmitted] = useState(props.submitted);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const save = useCallback(
    async (q: Question, value: AnswerValue) => {
      setSaveState("saving");
      const res = await fetch(`${api}/answers`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId: q.id, value }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setErrors((e) => ({ ...e, [q.id]: "" }));
        setSaveState("saved");
      } else {
        setErrors((e) => ({ ...e, [q.id]: body.error ?? "Couldn't save" }));
        setSaveState("error");
      }
    },
    [api],
  );

  const change = (q: Question, value: AnswerValue, immediate = false) => {
    setAnswers((a) => ({ ...a, [q.id]: value }));
    clearTimeout(timers.current[q.id]);
    timers.current[q.id] = setTimeout(() => save(q, value), immediate ? 0 : 900);
  };
  // Saves a field right away if it has a pending autosave (on blur, and before submitting).
  const flush = (q: Question): Promise<void> => {
    if (!timers.current[q.id]) return Promise.resolve();
    clearTimeout(timers.current[q.id]);
    delete timers.current[q.id];
    return save(q, answers[q.id] ?? null);
  };

  const ctx = (q: Question) => ({
    assetCount: assets.filter((a) => a.question_id === q.id).length,
    connected: connections.some((c) => c.provider === q.provider && c.status === "connected") || helpFor(answers, q.provider),
  });
  const progress = useMemo(() => {
    const qs = SECTIONS.flatMap((s) => s.questions);
    const done = qs.filter((q) => isAnswered(q, answers[q.id], ctx(q)));
    return { done: done.length, total: qs.length, missing: qs.filter((q) => q.required && !done.includes(q)) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, assets, connections]);

  async function submit() {
    setSubmitError(null);
    await Promise.all(Object.keys(timers.current).map((id) => flush(SECTIONS.flatMap((s) => s.questions).find((q) => q.id === id)!)));
    const res = await fetch(`${api}/submit`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (res.ok) setSubmitted(true);
    else setSubmitError(body.missing ? `Still needed: ${body.missing.map((m: { label: string }) => m.label).join(" · ")}` : body.error ?? "Couldn't submit");
  }

  return (
    <>
      <header className="topbar">
        <div className="brandmark">
          Fluid Creatives <span>· Onboarding</span>
        </div>
        <div className="saving" aria-live="polite">
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes saved" : saveState === "error" ? "Something didn't save" : ""}
        </div>
      </header>
      <main className="wrap" style={{ paddingTop: 8 }}>
        <div className="ob-hero">
          <h1>Welcome, {props.clientName}</h1>
          <p className="muted" style={{ maxWidth: 640, margin: "8px 0 16px" }}>
            Everything we need to run your email. It saves as you go, so you can close this page and come back to the same link anytime.
          </p>
          <div className="bar" style={{ maxWidth: 420 }}>
            <div style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
          </div>
          <p className="small muted" style={{ marginTop: 6 }}>
            {progress.done} of {progress.total} answered
          </p>
        </div>

        <div className="ob">
          <nav className="ob-nav" aria-label="Sections">
            {SECTIONS.map((s) => {
              const done = s.questions.filter((q) => isAnswered(q, answers[q.id], ctx(q))).length;
              return (
                <a key={s.id} href={`#${s.id}`} className={done === s.questions.length ? "done" : ""}>
                  {s.title}
                  <span className="count">
                    {done}/{s.questions.length}
                  </span>
                </a>
              );
            })}
          </nav>

          <div>
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="card" style={{ scrollMarginTop: 16 }}>
                <h2>{s.title}</h2>
                <p className="intro">{s.intro}</p>
                {s.questions.map((q) => (
                  <div className="field" key={q.id}>
                    <label className="label" htmlFor={q.id}>
                      {q.label}
                      {q.required && <span className="req" aria-label="required">*</span>}
                    </label>
                    {q.help && <p className="help">{q.help}</p>}
                    {q.type === "files" ? (
                      <Files q={q} api={api} token={props.token} assets={assets} setAssets={setAssets} />
                    ) : q.type === "connection" ? (
                      <Connection q={q} api={api} connection={connections.find((c) => c.provider === q.provider)} setConnections={setConnections} shopifyOAuth={props.shopifyOAuth} notice={q.provider === "shopify" ? props.shopifyNotice : undefined} />
                    ) : (
                      <Input q={q} value={answers[q.id]} onChange={(v, now) => change(q, v, now)} onBlur={() => flush(q)} />
                    )}
                    {errors[q.id] && <div className="field-error">{errors[q.id]}</div>}
                  </div>
                ))}
              </section>
            ))}

            <div className="submit-bar">
              {submitted ? (
                <div className="notice notice--good" style={{ flex: 1 }}>
                  Thanks, it&apos;s with the Fluid team. You can still come back and update anything here.
                </div>
              ) : (
                <>
                  <div className="small muted" style={{ flex: 1, minWidth: 220 }}>
                    {submitError ?? (progress.missing.length ? `${progress.missing.length} required question${progress.missing.length > 1 ? "s" : ""} left` : "Everything required is in. Send it over when you're ready.")}
                  </div>
                  <button className="btn" onClick={submit} disabled={progress.missing.length > 0}>
                    Submit to Fluid
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function helpFor(answers: Record<string, AnswerValue>, provider?: string) {
  const h = String(answers.connection_help ?? "");
  return h === "Help me connect both" || (!!provider && h.toLowerCase() === `help me connect ${provider}`);
}

function Input({ q, value, onChange, onBlur }: { q: Question; value: AnswerValue | undefined; onChange: (v: AnswerValue, now?: boolean) => void; onBlur: () => void }) {
  if (q.type === "textarea") return <textarea id={q.id} className="textarea" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />;
  if (q.type === "choice")
    return (
      <div className="choices" role="group" aria-labelledby={q.id}>
        {q.options!.map((o) => (
          <button type="button" key={o} className="choice" aria-pressed={value === o} onClick={() => onChange(value === o ? null : o, true)}>
            {o}
          </button>
        ))}
      </div>
    );
  if (q.type === "list") {
    const items = Array.isArray(value) ? value : [];
    const rows = Array.from({ length: q.max ?? 3 }, (_, i) => items[i] ?? "");
    return (
      <div>
        {rows.map((v, i) => (
          <div className="list-row" key={i}>
            <span className="num">{i + 1}.</span>
            <input
              className="input"
              id={i === 0 ? q.id : undefined}
              value={v}
              onChange={(e) => {
                const next = [...rows];
                next[i] = e.target.value;
                while (next.length && !next[next.length - 1]) next.pop();
                onChange(next);
              }}
              onBlur={onBlur}
            />
          </div>
        ))}
      </div>
    );
  }
  const type = q.type === "email" ? "email" : q.type === "url" ? "url" : q.type === "number" || q.type === "percent" ? "number" : "text";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: q.type === "percent" || q.type === "number" ? 200 : undefined }}>
      <input
        id={q.id}
        className="input"
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        min={type === "number" ? 0 : undefined}
        max={q.type === "percent" ? 100 : undefined}
        placeholder={q.placeholder}
        value={value == null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {q.type === "percent" && <span className="muted">%</span>}
    </div>
  );
}

function Files({ q, api, assets, setAssets }: { q: Question; api: string; token: string; assets: InitialAsset[]; setAssets: React.Dispatch<React.SetStateAction<InitialAsset[]>> }) {
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const mine = assets.filter((a) => a.question_id === q.id);

  async function upload(files: FileList | File[]) {
    setError(null);
    for (const file of Array.from(files)) {
      setBusy((n) => n + 1);
      try {
        const meta = { questionId: q.id, fileName: file.name, contentType: file.type || "application/octet-stream", bytes: file.size };
        const start = await fetch(`${api}/assets`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "start", ...meta }) });
        const s = await start.json();
        if (!start.ok) throw new Error(s.error);
        const t = s.target;
        if (t.kind === "supabase") {
          const { error: upErr } = await createClient(t.url, t.anonKey).storage.from(t.bucket).uploadToSignedUrl(t.path, t.token, file, { contentType: meta.contentType });
          if (upErr) throw new Error(upErr.message);
        } else {
          const put = await fetch(t.uploadUrl, { method: "PUT", body: file });
          if (!put.ok) throw new Error("Upload failed");
        }
        const finish = await fetch(`${api}/assets`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "finish", path: t.path, ...meta }) });
        const f = await finish.json();
        if (!finish.ok) throw new Error(f.error);
        setAssets((a) => [...a, f.asset]);
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`);
      } finally {
        setBusy((n) => n - 1);
      }
    }
  }

  async function remove(id: string) {
    const res = await fetch(`${api}/assets?id=${id}`, { method: "DELETE" });
    if (res.ok) setAssets((a) => a.filter((x) => x.id !== id));
  }

  return (
    <div>
      <div
        className={`drop${over ? " over" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          upload(e.dataTransfer.files);
        }}
      >
        {busy ? `Uploading ${busy} file${busy > 1 ? "s" : ""}…` : "Drop files here or click to choose"}
        <input ref={input} type="file" multiple hidden accept="image/*,.pdf,.woff,.woff2,.otf,.ttf" onChange={(e) => e.target.files && upload(e.target.files)} />
      </div>
      {error && <div className="field-error">{error}</div>}
      {mine.length > 0 && (
        <div className="files">
          {mine.map((a) => (
            <div className="file" key={a.id} title={a.file_name ?? ""}>
              {a.content_type?.startsWith("image/") ? <img src={a.url} alt={a.file_name ?? ""} /> : <span>{a.file_name}</span>}
              <button type="button" aria-label={`Remove ${a.file_name}`} onClick={() => remove(a.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STEPS: Record<string, React.ReactNode[]> = {
  klaviyo: [
    <>In Klaviyo, click your account name (bottom left), then <b>Settings → API keys</b>.</>,
    <>Click <b>Create Private API Key</b>, name it &ldquo;Fluid Creatives&rdquo; and choose <b>Full Access Key</b>.</>,
    <>Copy the key (it starts with <code>pk_</code>) and paste it below.</>,
  ],
  // Token paste is only for stores that already have a custom app made before January 2026:
  // Shopify no longer lets merchants create new ones in their admin.
  shopify: [
    <>In Shopify admin, go to <b>Settings → Apps and sales channels → Develop apps</b> and open your existing custom app.</>,
    <>Check its <b>Admin API scopes</b> include <code>read_products</code>, <code>read_orders</code>, <code>read_all_orders</code>, <code>read_customers</code> and <code>read_inventory</code>.</>,
    <>Copy the <b>Admin API access token</b> (it starts with <code>shpat_</code>) and paste it below with your store&apos;s .myshopify.com address.</>,
  ],
};

const SHOPIFY_NOTICES: Record<string, { kind: "good" | "bad" | "warn"; text: string }> = {
  connected: { kind: "good", text: "Shopify is connected." },
  unavailable: { kind: "warn", text: "The Shopify install isn't available yet. Pick \"Help me connect Shopify\" below and we'll set it up with you." },
  "bad-shop": { kind: "bad", text: "Use your store's .myshopify.com address (Shopify admin → Settings → Domains)." },
};

function Connection({ q, api, connection, setConnections, shopifyOAuth, notice }: { q: Question; api: string; connection?: Conn; setConnections: React.Dispatch<React.SetStateAction<Conn[]>>; shopifyOAuth: boolean; notice?: string }) {
  const [key, setKey] = useState("");
  const [shop, setShop] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "good" | "bad" | "warn"; text: string } | null>(notice ? SHOPIFY_NOTICES[notice] ?? { kind: "bad", text: notice } : null);
  const [replacing, setReplacing] = useState(false);
  const isShopify = q.provider === "shopify";
  const [pasteToken, setPasteToken] = useState(!shopifyOAuth);

  async function connect() {
    setBusy(true);
    setMsg(null);
    const body = isShopify ? { provider: "shopify", shop, token: key } : { provider: "klaviyo", key };
    const res = await fetch(`${api}/connections`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const r = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ kind: "bad", text: r.error ?? "Couldn't connect" });
    setConnections((cs) => [...cs.filter((c) => c.provider !== q.provider), r.connection]);
    setKey("");
    setReplacing(false);
    setMsg(r.warning ? { kind: "warn", text: r.warning } : null);
  }

  const connected = connection?.status === "connected" && !replacing;
  return (
    <div className="conn">
      <div className="conn-head">
        <strong>{q.label}</strong>
        {connected ? <span className="chip chip--good">Connected{connection?.account_name ? ` · ${connection.account_name}` : ""}</span> : <span className="chip">Not connected</span>}
      </div>
      {connected ? (
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setReplacing(true)}>
          Replace key
        </button>
      ) : (
        <>
          {isShopify && !pasteToken && (
            <>
              <p className="small muted" style={{ margin: "0 0 10px" }}>
                Enter your store&apos;s .myshopify.com address, then approve read access for Fluid in Shopify. Takes about a minute.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input className="input" style={{ flex: 1, minWidth: 220 }} placeholder="yourstore.myshopify.com" value={shop} onChange={(e) => setShop(e.target.value)} autoComplete="off" />
                <a className="btn" aria-disabled={!shop} href={shop ? `${api}/shopify-install?shop=${encodeURIComponent(shop)}` : undefined}>
                  Install Fluid on Shopify
                </a>
              </div>
              <button type="button" className="btn btn--ghost btn--small" style={{ marginTop: 10 }} onClick={() => setPasteToken(true)}>
                My store already has a custom app from before 2026
              </button>
            </>
          )}
          {(!isShopify || pasteToken) && (
            <>
              <ol>
                {STEPS[q.provider!].map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              {isShopify && !shopifyOAuth && (
                <p className="small muted" style={{ margin: "-4px 0 10px" }}>
                  Store set up after January 2026, or no custom app? Pick &ldquo;Help me connect Shopify&rdquo; below and we&apos;ll set it up with you.
                </p>
              )}
              {isShopify && (
                <input className="input" style={{ marginBottom: 8 }} placeholder="yourstore.myshopify.com" value={shop} onChange={(e) => setShop(e.target.value)} autoComplete="off" />
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  className="input"
                  style={{ flex: 1, minWidth: 220 }}
                  type="password"
                  autoComplete="off"
                  placeholder={isShopify ? "shpat_…" : "pk_…"}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
                <button type="button" className="btn" disabled={busy || !key || (isShopify && !shop)} onClick={connect}>
                  {busy ? "Checking…" : "Connect"}
                </button>
              </div>
            </>
          )}
        </>
      )}
      {msg && (
        <div className={`notice notice--${msg.kind}`} style={{ marginTop: 10 }}>
          {msg.text}
        </div>
      )}
      <p className="small muted" style={{ margin: "10px 0 0" }}>
        Your key is checked, then stored encrypted. Nothing is sent to your customers without your approval.
      </p>
    </div>
  );
}
