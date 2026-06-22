import { api } from "./api";
import { useAsync } from "./useAsync";
import type { Hypothesis, OverallStats, Signal } from "./types";
import { OverallReadout } from "./components/OverallReadout";
import { HypothesisTable } from "./components/HypothesisTable";
import { LogHypothesisForm } from "./components/LogHypothesisForm";
import { PendingList } from "./components/PendingList";

export default function App() {
  const signals = useAsync<Signal[]>(() => api.listSignals(), []);
  const overall = useAsync<OverallStats>(() => api.overall(), []);
  const hyps = useAsync<Hypothesis[]>(() => api.listHypotheses(), []);

  function refreshData() {
    overall.reload();
    hyps.reload();
  }

  const pending = (hyps.data ?? []).filter((h) => h.status === "pending");

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
          onClick={refreshData}
        >
          Refresh
        </button>
      </header>

      <section className="panel">
        <h2 className="panel__title">Log a hypothesis</h2>
        {signals.loading && <p className="state">Loading signals…</p>}
        {signals.error && <p className="state state--error">{signals.error}</p>}
        {signals.data && (
          <LogHypothesisForm signals={signals.data} onCreated={refreshData} />
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">
          Awaiting verification
          {pending.length > 0 && (
            <span className="panel__count">{pending.length}</span>
          )}
        </h2>
        {hyps.loading && <p className="state">Loading…</p>}
        {hyps.error && <p className="state state--error">{hyps.error}</p>}
        {hyps.data && (
          <PendingList pending={pending} onVerified={refreshData} />
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">Overall</h2>
        {overall.loading && <p className="state">Loading stats…</p>}
        {overall.error && (
          <p className="state state--error">
            Can’t reach the API ({overall.error}). Is the backend running on{" "}
            <code>http://localhost:8000</code>?
          </p>
        )}
        {overall.data && <OverallReadout stats={overall.data} />}
      </section>

      <section className="panel">
        <h2 className="panel__title">Hypotheses</h2>
        {hyps.loading && <p className="state">Loading…</p>}
        {hyps.error && <p className="state state--error">{hyps.error}</p>}
        {hyps.data && <HypothesisTable hypotheses={hyps.data} />}
      </section>
    </div>
  );
}
