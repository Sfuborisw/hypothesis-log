import type { OverallStats } from "../types";
import { pct } from "../format";

export function OverallReadout({ stats }: { stats: OverallStats }) {
  const cells: Array<{ label: string; value: string; accent?: boolean }> = [
    { label: "Hit rate", value: pct(stats.hit_rate), accent: true },
    { label: "Verified", value: String(stats.verified) },
    { label: "Hits", value: String(stats.hits) },
    { label: "Misses", value: String(stats.misses) },
    { label: "Pending", value: String(stats.pending) },
    { label: "Total logged", value: String(stats.total_hypotheses) },
  ];
  return (
    <div className="readout">
      {cells.map((c) => (
        <div className="stat" key={c.label}>
          <div
            className={`stat__value ${c.accent ? "stat__value--accent" : ""}`}
          >
            {c.value}
          </div>
          <div className="stat__label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
