// Turns a campaign calendar written in Fluid's strategy format into structured sends for the calendar view.
// Format (what the strategist writes):
//   **Mon Nov 23 · Email · What a cup of ceremonial costs**      (channel: Email | SMS | SMS only | Email + SMS)
//   - Angle: Which One Is Right
//   - Type: value | promo                                       (optional; inferred when missing)
//   - Message: …   - Segment: … · Format: …                      ("·" splits several fields on one line)
// The year comes from the document title/status line (e.g. "Nov 23 → Dec 22, 2026"), rolling over at January.

export type SendType = "value" | "promo";
export type CalendarSend = { date: string; channel: "email" | "sms" | "email+sms"; type: SendType; title: string; note?: string; fields: { label: string; value: string }[]; link?: string };
export type Calendar = { title: string; status?: string; sends: CalendarSend[]; sections: { heading: string; markdown: string }[] };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const PROMO = /\b(sale|black friday|cyber|bfcm|% ?off|\d+%|discount|deal|offer|early access|last (day|call|chance)|ends (tonight|tomorrow|at midnight)|flash|code\b|free shipping|bundle price|price drop|upgrade)\b/i;

export function parseCalendarMarkdown(md: string, fallbackYear = new Date().getFullYear()): Calendar {
  const lines = md.split("\n");
  const title = (lines.find((l) => /^# /.test(l)) ?? "# Campaign calendar").replace(/^#\s+/, "").trim();
  const status = lines.find((l) => /^Status:/i.test(l))?.replace(/^Status:\s*/i, "").trim();
  const startYear = Number(title.match(/\b(20\d\d)\b/)?.[1] ?? status?.match(/\b(20\d\d)\b/)?.[1] ?? fallbackYear);
  const header = /^\*\*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\.?\s+([A-Z][a-z]{2})[a-z]*\.?\s+(\d{1,2})\s*·\s*([^·*]+?)\s*·\s*(.+?)\*\*\s*(.*)$/;
  const sends: CalendarSend[] = [];
  let cur: CalendarSend | null = null, lastMonth = -1, year = startYear;
  const sectionStarts: { heading: string; at: number }[] = [];
  lines.forEach((line, i) => {
    const h = line.match(header);
    if (h) {
      const mi = MONTHS.indexOf(h[1].toLowerCase());
      if (lastMonth >= 0 && mi < lastMonth) year += 1; // Dec → Jan
      lastMonth = mi;
      const ch = h[3].toLowerCase();
      cur = { date: `${year}-${String(mi + 1).padStart(2, "0")}-${h[2].padStart(2, "0")}`, channel: /email/.test(ch) && /sms/.test(ch) ? "email+sms" : /sms/.test(ch) ? "sms" : "email", type: "value", title: h[4].replace(/\*+/g, "").trim(), note: h[5].replace(/^\(|\)$/g, "").trim() || undefined, fields: [] };
      sends.push(cur);
      return;
    }
    if (/^##\s+/.test(line)) { cur = null; sectionStarts.push({ heading: line.replace(/^##\s+/, "").trim(), at: i }); return; }
    if (/^\*\*Week /i.test(line) || !line.trim()) { if (!line.trim()) return; cur = null; return; }
    const b = line.match(/^\s*[-*]\s+(.*)$/);
    if (cur && b) {
      for (const part of b[1].split(/\s+·\s+/)) {
        const kv = part.match(/^\**([A-Z][A-Za-z ()/-]{1,30}?)\**:\s*(.+)$/);
        if (kv) cur.fields.push({ label: kv[1].trim(), value: kv[2].trim() });
        else if (cur.fields.length) cur.fields[cur.fields.length - 1].value += ` · ${part.trim()}`;
        else cur.fields.push({ label: "Note", value: part.trim() });
      }
    }
  });
  for (const s of sends) {
    const t = s.fields.find((f) => /^type$/i.test(f.label))?.value.toLowerCase();
    const angle = s.fields.find((f) => /^angle$/i.test(f.label))?.value ?? "";
    const hasOffer = s.fields.some((f) => /^offer/i.test(f.label) && !/^(none|no offer)/i.test(f.value));
    s.type = t ? (/promo|sale|sales/.test(t) ? "promo" : "value") : hasOffer || PROMO.test(`${s.title} ${angle}`) ? "promo" : "value";
    s.fields = s.fields.filter((f) => !/^type$/i.test(f.label));
    const link = [s.note, ...s.fields.map((f) => f.value)].join(" ").match(/https?:\/\/\S+?(?=[)\s]|$)/);
    if (link) s.link = link[0];
  }
  // Non-calendar sections (data, angles, mix, blockers) stay available as extra panels.
  const sections = sectionStarts.filter((s) => !/^calendar/i.test(s.heading)).map((s, k) => {
    const end = sectionStarts[sectionStarts.indexOf(s) + 1]?.at ?? lines.length;
    return { heading: s.heading, markdown: lines.slice(s.at + 1, end).join("\n").trim() };
  }).filter((s) => s.markdown && !s.markdown.includes("**Mon ") && !s.markdown.includes("**Tue "));
  return { title, status, sends, sections };
}
