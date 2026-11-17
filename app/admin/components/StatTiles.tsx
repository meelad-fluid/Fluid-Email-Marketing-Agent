// change: fraction vs the comparison period (0.15 = up 15%); null when there's nothing to compare.
export type Tile = { label: string; value: string; note?: string; change?: number | null; vs?: string };

const changeText = (c: number) => `${Math.abs(c) >= 10 ? ">999" : Math.round(Math.abs(c) * 100)}%`;

// KPI row: label, value, optional context line. Values use the default (proportional) figures.
export function StatTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="tiles">
      {tiles.map((t) => (
        <div className="tile" key={t.label}>
          <div className="tile-label">{t.label}</div>
          <div className="tile-value">{t.value}</div>
          {t.change != null && Number.isFinite(t.change) && (
            <div className={`tile-change ${t.change > 0.005 ? "up" : t.change < -0.005 ? "down" : "flat"}`}>
              <span aria-hidden>{t.change > 0.005 ? "▲" : t.change < -0.005 ? "▼" : "■"}</span> {t.change > 0.005 ? "Up" : t.change < -0.005 ? "Down" : "Flat"} {changeText(t.change)}
              {t.vs && <span className="tile-vs"> vs {t.vs}</span>}
            </div>
          )}
          {t.note && <div className="tile-note">{t.note}</div>}
        </div>
      ))}
    </div>
  );
}
