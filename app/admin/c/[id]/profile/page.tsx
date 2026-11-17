import { notFound } from "next/navigation";
import { SECTIONS, type AnswerValue, type Question } from "@/lib/onboarding/questions";
import { getStore } from "@/lib/store";
import { NewLink } from "../../../LinkTools";
import { clientSummary } from "../../../summary";

// Profile tab: onboarding answers by section, uploaded assets, connections and the onboarding link.
export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const client = await store.getClient(id);
  if (!client) notFound();
  const [summary, answers, assets] = await Promise.all([clientSummary(client), store.getAnswers(id), store.listAssets(id)]);
  const urls = new Map(await Promise.all(assets.map(async (a) => [a.id, await store.assetUrl(a)] as const)));

  const show = (q: Question, v: AnswerValue | undefined) => {
    if (q.type === "files") {
      const mine = assets.filter((a) => a.question_id === q.id);
      if (!mine.length) return <dd className="empty">No files</dd>;
      return (
        <dd>
          <div className="files">
            {mine.map((a) => (
              <a key={a.id} className="file" href={urls.get(a.id)} target="_blank" rel="noreferrer" title={a.file_name ?? ""}>
                {a.content_type?.startsWith("image/") ? <img src={urls.get(a.id)} alt={a.file_name ?? ""} /> : <span>{a.file_name}</span>}
              </a>
            ))}
          </div>
        </dd>
      );
    }
    if (q.type === "connection") {
      const c = summary.connections.find((x) => x.provider === q.provider);
      return c?.status === "connected" ? (
        <dd>
          <span className="chip chip--good">Connected{c.account_name ? ` · ${c.account_name}` : ""}</span>
          {c.verified_at && <span className="small muted"> checked {new Date(c.verified_at).toLocaleDateString()}</span>}
        </dd>
      ) : (
        <dd className="empty">Not connected</dd>
      );
    }
    const empty = v == null || (Array.isArray(v) ? !v.some(Boolean) : String(v).trim() === "");
    if (empty) return <dd className="empty">Not answered</dd>;
    if (Array.isArray(v)) return <dd><ol style={{ margin: 0, paddingLeft: 20 }}>{v.filter(Boolean).map((x, i) => <li key={i}>{x}</li>)}</ol></dd>;
    if (q.type === "url") return <dd><a href={String(v)} target="_blank" rel="noreferrer">{String(v)}</a></dd>;
    return <dd>{q.type === "percent" ? `${v}%` : String(v)}</dd>;
  };

  return (
    <>
      <h1 className="page-title">Client profile</h1>
      <p className="page-sub">Their onboarding answers, brand assets, connections and onboarding link.</p>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <h2 style={{ fontSize: 17 }}>Onboarding</h2>
          <div className="bar" style={{ margin: "12px 0 6px" }}><div style={{ width: `${summary.progress.percent}%` }} /></div>
          <p className="small muted" style={{ margin: 0 }}>
            {summary.progress.answered} of {summary.progress.total} answered
            {summary.progress.requiredMissing.length ? ` · still needed: ${summary.progress.requiredMissing.map((m) => m.label).join(", ")}` : " · all required answers in"}
          </p>
        </div>
        <div className="card">
          <h2 style={{ fontSize: 17, marginBottom: 10 }}>Onboarding link</h2>
          <NewLink clientId={client.id} hasActive={summary.hasActiveLink} />
        </div>
      </div>

      {SECTIONS.map((s) => (
        <section className="card" key={s.id}>
          <h2 style={{ fontSize: 18 }}>{s.title}</h2>
          <dl style={{ margin: "8px 0 0" }}>
            {s.questions.map((q) => (
              <div className="answer" key={q.id}>
                <dt>{q.label}</dt>
                {show(q, answers[q.id])}
              </div>
            ))}
          </dl>
        </section>
      ))}
    </>
  );
}
