import { api } from "./api";
import { useAsync } from "./useAsync";
import type { Hypothesis, OverallStats } from "./types";

function pct(value: number | null): string {
  return value == null ? "—" : `${(value * 100).toFixed(1)}%`;
}

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

const DIR_GLYPH: Record<string, string> = { up: "▲", down: "▼", sideways: "▶" };

function Readout({ stats }: { stats: OverallStats }) {
  const cells: Array<{ label: string; value: string; tone?: string }> = [
    { label: "Hit rate", value: pct(stats.hit_rate), tone: "accent" },
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
            className={`stat__value ${c.tone === "accent" ? "stat__value--accent" : ""}`}
          >
            {c.value}
          </div>
          <div className="stat__label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const overall = useAsync<OverallStats>(() => api.overall(), []);
  const hyps = useAsync<Hypothesis[]>(() => api.listHypotheses(), []);

  return (
    <div className="app">
      <header className="header">
        <div className="header__mark">H/L</div>
        <div>
          <h1 className="header__title">Hypothesis Log</h1>
          <p className="header__tag">
            Turn trading gut-feel into a measured edge.
          </p>
        </div>
        <button
          className="btn btn--ghost header__refresh"
          onClick={() => {
            overall.reload();
            hyps.reload();
          }}
        >
          Refresh
        </button>
      </header>

      <section className="panel">
        <h2 className="panel__title">Overall</h2>
        {overall.loading && <p className="state">Loading stats…</p>}
        {overall.error && (
          <p className="state state--error">
            Can’t reach the API ({overall.error}). Is the backend running on{" "}
            <code>http://localhost:8000</code>?
          </p>
        )}
        {overall.data && <Readout stats={overall.data} />}
      </section>

      <section className="panel">
        <h2 className="panel__title">Hypotheses</h2>
        {hyps.loading && <p className="state">Loading…</p>}
        {hyps.error && <p className="state state--error">{hyps.error}</p>}
        {hyps.data && hyps.data.length === 0 && (
          <p className="state">No hypotheses yet. Log one to get started.</p>
        )}
        {hyps.data && hyps.data.length > 0 && (
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
              {hyps.data.map((h) => (
                <tr key={h.id}>
                  <td className="mono htable__ticker">{h.ticker}</td>
                  <td>
                    <span className="mono">
                      {DIR_GLYPH[h.predicted_direction]}
                    </span>{" "}
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
                  <td className="mono htable__num">
                    {h.price_change_pct == null
                      ? "—"
                      : `${h.price_change_pct > 0 ? "+" : ""}${h.price_change_pct.toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
