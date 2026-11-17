import Link from "next/link";
import { PRESETS, type Range } from "@/lib/klaviyo/data";

// The one filter row above a report: the last 30, 60 or 90 days, or custom dates. Every number below it uses it.
export function RangeFilter({ base, current, query = {} }: { base: string; current: Range; query?: Record<string, string> }) {
  return (
    <div className="filters" role="group" aria-label="Date range">
      {PRESETS.map((r) => (
        <Link key={r} href={`${base}?${new URLSearchParams({ ...query, days: String(r) })}`} className={r === current.preset ? "seg active" : "seg"} aria-current={r === current.preset ? "true" : undefined}>
          Last {r} days
        </Link>
      ))}
      <details className="range-custom" open={!current.preset || undefined}>
        <summary className={current.preset ? "seg" : "seg active"}>{current.preset ? "Custom" : current.label}</summary>
        <form method="get" action={base} className="range-form">
          {Object.entries(query).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <label>From <input type="date" name="from" defaultValue={current.from} required className="input input--small" /></label>
          <label>To <input type="date" name="to" defaultValue={current.to} max={current.preset ? current.to : undefined} required className="input input--small" /></label>
          <button className="btn btn--small">Apply</button>
        </form>
      </details>
    </div>
  );
}
