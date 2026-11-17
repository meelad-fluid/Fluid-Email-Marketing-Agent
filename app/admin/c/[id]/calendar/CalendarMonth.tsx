import Link from "next/link";
import { money } from "@/lib/format";
import { campaignsBetween, type Campaign } from "@/lib/klaviyo/data";
import { plannedSendsBetween } from "@/lib/strategy/data";
import { clientTimeZone } from "@/lib/onboarding/timezone";
import { getStore } from "@/lib/store";

// The month calendar: email and SMS campaigns from Klaviyo, in the client's timezone.
// Sent sends show their revenue; scheduled ones are marked; planned sends open their brief.

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const localDay = (iso: string, tz: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
const localTime = (iso: string, tz: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });

export async function CalendarMonth({ id, month: m, selected }: { id: string; month?: string; selected?: string }) {
  const tz = clientTimeZone((await getStore().getAnswers(id)).timezone);
  const today = localDay(new Date().toISOString(), tz);
  const [year, month] = (m && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7)).split("-").map(Number);

  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = first.getUTCDay();
  // Query a day either side of the month, then bucket by the client's local date.
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const [campaigns, planned] = await Promise.all([
    campaignsBetween(id, new Date(Date.UTC(year, month - 1, 0)), new Date(Date.UTC(year, month, 2))),
    plannedSendsBetween(id, monthStart, monthEnd),
  ]);
  const plannedByDay = new Map<string, typeof planned>();
  for (const p of planned) plannedByDay.set(p.send_date, [...(plannedByDay.get(p.send_date) ?? []), p]);
  const byDay = new Map<string, Campaign[]>();
  for (const c of campaigns) {
    const when = c.send_time ?? c.scheduled_at;
    if (!when) continue;
    const d = localDay(when, tz);
    if (!d.startsWith(`${year}-${String(month).padStart(2, "0")}`)) continue;
    byDay.set(d, [...(byDay.get(d) ?? []), c]);
  }
  const monthKey = (y: number, mo: number) => `${y}-${String(mo).padStart(2, "0")}`;
  const prev = month === 1 ? monthKey(year - 1, 12) : monthKey(year, month - 1);
  const next = month === 12 ? monthKey(year + 1, 1) : monthKey(year, month + 1);
  const base = `/admin/c/${id}/calendar`;
  const inMonth = [...byDay.values()].flat();
  const monthRevenue = inMonth.filter((c) => c.status === "Sent").reduce((n, c) => n + (c.stats?.conversion_value ?? 0), 0);
  const counts = { email: [...inMonth, ...planned].filter((c) => c.channel === "email").length, sms: [...inMonth, ...planned].filter((c) => c.channel === "sms").length };

  return (
    <>
      <div className="cal-head">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link className="btn btn--ghost btn--small" href={`${base}?month=${prev}`} aria-label="Previous month">←</Link>
          <h2 style={{ fontSize: 20, minWidth: 170, textAlign: "center" }}>{first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</h2>
          <Link className="btn btn--ghost btn--small" href={`${base}?month=${next}`} aria-label="Next month">→</Link>
          <Link className="btn btn--ghost btn--small" href={`${base}?month=${today.slice(0, 7)}`}>This month</Link>
        </div>
        <div className="legend small">
          <span><i className="viz-key viz-key--email" /> Email · {counts.email}</span>
          <span><i className="viz-key viz-key--sms" /> SMS · {counts.sms}</span>
          {planned.length > 0 && <span><span className="legend-dash" /> Planned · {planned.length}</span>}
          <span className="muted">{monthRevenue > 0 ? `Sent revenue ${money(monthRevenue)} · ` : ""}times in {tz.split("/")[1].replace("_", " ")} time</span>
        </div>
      </div>

      <div className="cal" role="grid" aria-label="Campaign calendar">
        {WEEKDAYS.map((d) => (
          <div key={d} className="cal-dow" role="columnheader">{d}</div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={`lead-${i}`} className="cal-day cal-day--empty" aria-hidden />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = `${monthKey(year, month)}-${String(i + 1).padStart(2, "0")}`;
          const items = (byDay.get(day) ?? []).sort((a, b) => (a.send_time ?? a.scheduled_at ?? "").localeCompare(b.send_time ?? b.scheduled_at ?? ""));
          return (
            <div key={day} className={`cal-day${day === today ? " cal-day--today" : ""}`} role="gridcell">
              <div className="cal-num">{i + 1}</div>
              {items.map((c) => {
                const when = c.send_time ?? c.scheduled_at!;
                const title = `${c.channel === "email" ? "Email" : "SMS"} · ${c.status} · ${localTime(when, tz)}\n${c.name}${c.subject ? `\nSubject: ${c.subject}` : ""}${c.stats ? `\nRevenue ${money(c.stats.conversion_value)} · ${c.stats.recipients.toLocaleString()} recipients` : ""}`;
                return (
                  <div key={c.campaign_id} className={`cal-item${c.status === "Sent" ? "" : " cal-item--planned"}`} title={title}>
                    <i className={`viz-key viz-key--${c.channel}`} />
                    <span className="cal-text">
                      <span className="cal-name">{c.channel === "email" ? c.subject ?? c.name : c.name.replace(/^FC \| (SMS: )?/, "")}</span>
                      <span className="cal-meta">
                        {localTime(when, tz)}
                        {c.status === "Sent" ? (c.stats ? ` · ${money(c.stats.conversion_value)}` : "") : ` · ${c.status}`}
                      </span>
                    </span>
                  </div>
                );
              })}
              {(plannedByDay.get(day) ?? []).sort((a, b) => (a.send_time ?? "").localeCompare(b.send_time ?? "")).map((p) => (
                <Link
                  key={p.id}
                  href={`${base}?month=${monthKey(year, month)}&send=${p.id}`}
                  scroll={false}
                  className={`cal-item cal-item--proposed${p.id === selected ? " cal-item--selected" : ""}`}
                  title={p.topic}
                >
                  <i className={`viz-key viz-key--${p.channel}`} />
                  <span className="cal-text">
                    <span className="cal-name">{p.name ?? p.topic}</span>
                    <span className="cal-meta">{p.send_time ?? ""} · {p.angle}</span>
                  </span>
                </Link>
              ))}
            </div>
          );
        })}
      </div>

    </>
  );
}
