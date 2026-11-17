"use client";

import { useEffect, useRef, useState } from "react";

// Revenue per campaign, one column per send, oldest → newest. Single series, so no legend: the
// card title names it. Every value is also in the table below the chart.

export type Column = { id: string; name: string; date: string; dateLabel: string; revenue: number; recipients: number };

const H = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 52 };

const niceMax = (v: number) => {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = [1, 2, 2.5, 5, 10].find((m) => m * p >= v)!;
  return n * p;
};
const tick = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 ? 1 : 0)}K` : `$${v}`);
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export function RevenueColumns({ columns, channel }: { columns: Column[]; channel: "email" | "sms" }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!columns.length) return <p className="muted small">No sent campaigns in this range.</p>;

  const max = niceMax(Math.max(...columns.map((c) => c.revenue)));
  const plotW = width - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / columns.length;
  const barW = Math.max(2, Math.min(24, slot - 2)); // ≤24px, and a ≥2px surface gap between neighbors
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];

  // One date label per month, at its first send, skipping labels that would collide.
  const monthLabels: { i: number; label: string }[] = [];
  columns.forEach((c, i) => {
    const m = c.date.slice(0, 7);
    if (i === 0 || m !== columns[i - 1].date.slice(0, 7)) {
      const x = PAD.left + i * slot;
      if (!monthLabels.length || x - (PAD.left + monthLabels[monthLabels.length - 1].i * slot) > 46) monthLabels.push({ i, label: new Date(c.date).toLocaleDateString("en-US", { month: "short" }) });
    }
  });

  const h = hover != null ? columns[hover] : null;
  const hx = hover != null ? PAD.left + hover * slot + slot / 2 : 0;

  return (
    <div ref={wrap} className="viz" style={{ position: "relative" }}>
      <svg width={width} height={H} role="img" aria-label={`${channel === "email" ? "Email" : "SMS"} revenue per campaign`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="viz-grid" />
            <text x={PAD.left - 8} y={y(t)} className="viz-tick" textAnchor="end" dominantBaseline="middle">
              {tick(t)}
            </text>
          </g>
        ))}
        {columns.map((c, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const top = y(c.revenue);
          const hgt = Math.max(0, PAD.top + plotH - top);
          const r = Math.min(4, barW / 2, hgt);
          // Rounded at the data end, square at the baseline.
          const d = hgt <= 0 ? "" : `M${x},${top + hgt} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + hgt} Z`;
          return (
            <g key={c.id}>
              {d && <path d={d} className={`viz-bar viz-bar--${channel}${hover === i ? " is-hover" : ""}`} />}
              {/* hit target: the whole slot, full height, bigger than the mark */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${c.name}, ${c.dateLabel}: ${money(c.revenue)}`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              />
            </g>
          );
        })}
        <line x1={PAD.left} x2={width - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} className="viz-axis" />
        {monthLabels.map((m) => (
          <text key={m.i} x={PAD.left + m.i * slot + slot / 2} y={H - 8} className="viz-tick" textAnchor="start">
            {m.label}
          </text>
        ))}
      </svg>
      {h && (
        <div className="viz-tip" style={{ left: Math.min(Math.max(hx, 110), width - 110), top: Math.max(0, y(h.revenue) - 8) }}>
          <div className="viz-tip-value">{money(h.revenue)}</div>
          <div className="viz-tip-row">
            <span className={`viz-key viz-key--${channel}`} />
            {h.name}
          </div>
          <div className="viz-tip-sub">
            {h.dateLabel} · {h.recipients.toLocaleString()} recipients
          </div>
        </div>
      )}
    </div>
  );
}
