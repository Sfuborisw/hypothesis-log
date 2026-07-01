import { useState } from "react";
import { api, ApiError } from "../api";
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

interface Props {
  hypotheses: Hypothesis[];
  onDeleted: () => void;
}

export function HypothesisTable({ hypotheses, onDeleted }: Props) {
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: number) {
    setDeletingId(id);
    setError(null);
    try {
      await api.deleteHypothesis(id);
      setConfirmId(null);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  }

  if (hypotheses.length === 0) {
    return (
      <p className="state">No hypotheses yet. Log one above to get started.</p>
    );
  }

  return (
    <>
      {error && <p className="form__error">{error}</p>}
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
            <th className="htable__actions" aria-label="Actions" />
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
              <td className="htable__actions">
                {confirmId === h.id ? (
                  <span className="rowconfirm">
                    <button
                      className="btn btn--sm btn--danger"
                      onClick={() => remove(h.id)}
                      disabled={deletingId === h.id}
                    >
                      {deletingId === h.id ? "Deleting…" : "Delete"}
                    </button>
                    <button
                      className="btn btn--sm btn--ghost"
                      onClick={() => setConfirmId(null)}
                      disabled={deletingId === h.id}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    className="iconbtn"
                    onClick={() => {
                      setConfirmId(h.id);
                      setError(null);
                    }}
                    aria-label={`Delete ${h.ticker} hypothesis`}
                    title="Delete"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                    </svg>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
