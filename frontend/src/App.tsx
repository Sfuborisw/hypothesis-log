import { useState } from "react";
import { api } from "./api";
import { useAsync } from "./useAsync";
import type { Hypothesis, OverallStats, Signal } from "./types";
import { OverallReadout } from "./components/OverallReadout";
import { HypothesisTable } from "./components/HypothesisTable";
import { PendingList } from "./components/PendingList";
import { Dashboard } from "./components/Dashboard";
import { ThemeToggle } from "./components/ThemeToggle";
import { CreateHypothesisModal } from "./components/CreateHypothesisModal";
import { useTheme } from "./useTheme";

export default function App() {
  const signals = useAsync<Signal[]>(() => api.listSignals(), []);
  const overall = useAsync<OverallStats>(() => api.overall(), []);
  const hyps = useAsync<Hypothesis[]>(() => api.listHypotheses(), []);
  const [version, setVersion] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const { theme, toggle } = useTheme();

  function refreshData() {
    overall.reload();
    hyps.reload();
    setVersion((v) => v + 1);
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
        <div className="header__actions">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <button className="btn btn--ghost" onClick={refreshData}>
            Refresh
          </button>
        </div>
      </header>

      <div className="create-bar">
        <button
          className="btn btn--primary btn--cta"
          onClick={() => setShowCreate(true)}
          disabled={!signals.data}
        >
          <span className="btn__plus">+</span> Log a hypothesis
        </button>
      </div>

      <section className="panel">
        <h2 className="panel__title">
          Awaiting verification
          {pending.length > 0 && (
            <span className="panel__count">{pending.length}</span>
          )}
        </h2>
        {hyps.loading && <p className="state">Loading…</p>}
        {hyps.error && <p className="state state--error">{hyps.error}</p>}
        {hyps.data && signals.data && (
          <PendingList
            pending={pending}
            signals={signals.data}
            onChanged={refreshData}
          />
        )}
      </section>

      <section className="panel">
        <h2 className="panel__title">Overall</h2>
        {overall.loading && <p className="state">Loading stats…</p>}
        {overall.error && (
          <p className="state state--error">
            Can’t reach the API ({overall.error}). Is the backend running on{" "}
            <code>http://localhost:8001</code>?
          </p>
        )}
        {overall.data && <OverallReadout stats={overall.data} />}
      </section>

      <section className="panel">
        <h2 className="panel__title">Analysis</h2>
        <Dashboard
          version={version}
          overallHitRate={overall.data?.hit_rate ?? null}
        />
      </section>

      <section className="panel">
        <h2 className="panel__title">Hypotheses</h2>
        {hyps.loading && <p className="state">Loading…</p>}
        {hyps.error && <p className="state state--error">{hyps.error}</p>}
        {hyps.data && (
          <HypothesisTable hypotheses={hyps.data} onDeleted={refreshData} />
        )}
      </section>

      {showCreate && signals.data && (
        <CreateHypothesisModal
          signals={signals.data}
          onClose={() => setShowCreate(false)}
          onCreated={refreshData}
        />
      )}
    </div>
  );
}
