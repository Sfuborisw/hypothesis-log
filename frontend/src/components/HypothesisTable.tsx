import type { Direction, Hypothesis } from "../types";
import { signed } from "../format";

const DIR_GLYPH: Record<Direction, string> = {
  up: "▲",
  down: "▼",
  sideways: "▶",
};

function StatusBadge({ hyp }: { hyp: Hypothesis }) {
  if (hyp.status === "pending")
    return <span className="badge badge--pending">Pending</span>;
  if (hyp.status === "cancelled")
    return <span className="badge badge--muted">Cancelled</span>;
  return hyp.is_hit === 1 ? (
    <span className="badge badge--hit">Hit</span>
  ) : (
    <span className="badge badge--miss">Miss</span>
  );
}

export function HypothesisTable({ hypotheses }: { hypotheses: Hypothesis[] }) {
  if (hypotheses.length === 0) {
    return (
      <p className="state">No hypotheses yet. Log one above to get started.</p>
    );
  }
  return (
    <table className="htable">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Predict</th>
          <th>Conf.</th>
          <th>Timeframe</th>
          <th>Signals</th>
          <th>Status</th>
          <th className="htable__num">Δ%</th>
        </tr>
      </thead>
      <tbody>
        {hypotheses.map((h) => (
          <tr key={h.id}>
            <td className="mono htable__ticker">{h.ticker}</td>
            <td>
              <span className="mono">{DIR_GLYPH[h.predicted_direction]}</span>{" "}
              {h.predicted_direction}
            </td>
            <td className="mono">{h.confidence}/5</td>
            <td className="mono">{h.timeframe}</td>
            <td>
              <div className="pills">
                {h.signals.map((s) => (
                  <span className="pill" key={s.id}>
                    {s.name}
                  </span>
                ))}
              </div>
            </td>
            <td>
              <StatusBadge hyp={h} />
            </td>
            <td className="mono htable__num">{signed(h.price_change_pct)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
