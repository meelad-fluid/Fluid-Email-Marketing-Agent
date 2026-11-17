// US holidays and retail moments the strategist plans around, computed for any date range so the
// team doesn't have to type them in. Client-specific sales and launches come from the team's notes
// and the client profile.

export type Moment = { date: string; name: string; kind: "holiday" | "retail" | "seasonal" };

const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const dow = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();

// nth weekday (0=Sun) of a month; n = -1 for the last one.
function nthWeekday(y: number, m: number, weekday: number, n: number) {
  if (n > 0) {
    const first = dow(y, m, 1);
    return 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
  }
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return last - ((dow(y, m, last) - weekday + 7) % 7);
}

// Easter Sunday (anonymous Gregorian algorithm)
function easter(y: number) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function addDays(y: number, m: number, d: number, n: number) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

function momentsForYear(y: number): Moment[] {
  const e = easter(y);
  const thanksgiving = nthWeekday(y, 11, 4, 4);
  return [
    { date: iso(y, 1, 1), name: "New Year's Day", kind: "holiday" },
    { date: iso(y, 1, nthWeekday(y, 1, 1, 3)), name: "Martin Luther King Jr. Day", kind: "holiday" },
    { date: iso(y, 2, 14), name: "Valentine's Day", kind: "retail" },
    { date: iso(y, 2, nthWeekday(y, 2, 1, 3)), name: "Presidents' Day", kind: "retail" },
    { date: iso(y, 3, 17), name: "St. Patrick's Day", kind: "holiday" },
    { date: iso(y, 3, 20), name: "First day of spring", kind: "seasonal" },
    { date: iso(y, e.month, e.day), name: "Easter", kind: "holiday" },
    { date: iso(y, 4, 22), name: "Earth Day", kind: "seasonal" },
    { date: iso(y, 5, nthWeekday(y, 5, 0, 2)), name: "Mother's Day", kind: "retail" },
    { date: iso(y, 5, nthWeekday(y, 5, 1, -1)), name: "Memorial Day", kind: "retail" },
    { date: iso(y, 6, nthWeekday(y, 6, 0, 3)), name: "Father's Day", kind: "retail" },
    { date: iso(y, 6, 19), name: "Juneteenth", kind: "holiday" },
    { date: iso(y, 6, 21), name: "First day of summer", kind: "seasonal" },
    { date: iso(y, 7, 4), name: "Independence Day", kind: "retail" },
    { date: iso(y, 8, 1), name: "Back to school season", kind: "seasonal" },
    { date: iso(y, 9, nthWeekday(y, 9, 1, 1)), name: "Labor Day", kind: "retail" },
    { date: iso(y, 9, 22), name: "First day of fall", kind: "seasonal" },
    { date: iso(y, 10, 31), name: "Halloween", kind: "retail" },
    { date: iso(y, 11, 11), name: "Veterans Day", kind: "holiday" },
    { date: iso(y, 11, thanksgiving), name: "Thanksgiving", kind: "holiday" },
    { date: addDays(y, 11, thanksgiving, 1), name: "Black Friday", kind: "retail" },
    { date: addDays(y, 11, thanksgiving, 2), name: "Small Business Saturday", kind: "retail" },
    { date: addDays(y, 11, thanksgiving, 4), name: "Cyber Monday", kind: "retail" },
    { date: addDays(y, 11, thanksgiving, 5), name: "Giving Tuesday", kind: "retail" },
    { date: iso(y, 12, nthWeekday(y, 12, 1, 2)), name: "Green Monday", kind: "retail" },
    { date: iso(y, 12, 14), name: "Free Shipping Day", kind: "retail" },
    { date: iso(y, 12, 21), name: "First day of winter", kind: "seasonal" },
    { date: iso(y, 12, 24), name: "Christmas Eve", kind: "holiday" },
    { date: iso(y, 12, 25), name: "Christmas Day", kind: "holiday" },
    { date: iso(y, 12, 26), name: "Boxing Day / post-holiday sales", kind: "retail" },
    { date: iso(y, 12, 31), name: "New Year's Eve", kind: "holiday" },
  ];
}

/** Holidays and retail moments between two dates (inclusive, YYYY-MM-DD). */
export function momentsBetween(start: string, end: string): Moment[] {
  const years = new Set([Number(start.slice(0, 4)), Number(end.slice(0, 4))]);
  return [...years]
    .flatMap(momentsForYear)
    .filter((m) => m.date >= start && m.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
}
