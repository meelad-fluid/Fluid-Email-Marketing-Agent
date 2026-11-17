// Number and date formatting for the internal view.

// NaN means "not available for this range" and shows as a dash, like null.
export const money = (n: number | null | undefined, compact = false) =>
  n == null || Number.isNaN(n) ? "–" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: compact || Math.abs(n) >= 1000 ? 0 : 2, notation: compact && Math.abs(n) >= 10000 ? "compact" : "standard" }).format(n);

export const count = (n: number | null | undefined, compact = false) =>
  n == null || Number.isNaN(n) ? "–" : new Intl.NumberFormat("en-US", { notation: compact && Math.abs(n) >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);

export const pct = (r: number | null | undefined, digits = 1) => (r == null || Number.isNaN(r) ? "–" : `${(r * 100).toFixed(digits)}%`);

export const shortDate = (iso: string | null | undefined, tz = "America/New_York") =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: tz }) : "–";

export const dateTime = (iso: string | null | undefined, tz = "America/New_York") =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz }) : "–";

export const ago = (iso: string | null | undefined) => {
  if (!iso) return "never";
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};
