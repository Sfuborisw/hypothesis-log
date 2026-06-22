import { useState } from "react";
import { api, ApiError } from "../api";
import type { Direction, Hypothesis } from "../types";

const DIR_GLYPH: Record<Direction, string> = {
  up: "▲",
  down: "▼",
  sideways: "▶",
};

interface Props {
  pending: Hypothesis[];
  onVerified: () => void;
}

/** A pending hypothesis is "due" once its target date is today or earlier. */
function isDue(targetDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, local-ish
  return targetDate <= today;
}

export function PendingList({ pending, onVerified }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open(id: number) {
    setActiveId(id);
    setPrice("");
    setNotes("");
    setError(null);
  }

  function cancel() {
    setActiveId(null);
    setError(null);
  }

  async function submit(id: number) {
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      setError("Verification price must be a positive number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.verifyHypothesis(id, {
        verification_price: p,
        post_notes: notes.trim() || null,
      });
      setActiveId(null);
      onVerified();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to verify.");
    } finally {
      setSubmitting(false);
    }
  }

  if (pending.length === 0) {
    return <p className="state">Nothing awaiting verification.</p>;
  }

  return (
    <ul className="queue">
      {pending.map((h) => {
        const due = isDue(h.target_verification_date);
        const isOpen = activeId === h.id;
        return (
          <li
            className={`queue__item ${due ? "queue__item--due" : ""}`}
            key={h.id}
          >
            <div className="queue__head">
              <div className="queue__meta">
                <span className="mono queue__ticker">{h.ticker}</span>
                <span className="queue__predict">
                  <span className="mono">
                    {DIR_GLYPH[h.predicted_direction]}
                  </span>{" "}
                  {h.predicted_direction}
                </span>
                <span className="mono queue__entry">@ {h.entry_price}</span>
                <span className="queue__date">
                  due {h.target_verification_date}
                  {due && <span className="badge badge--pending">Due</span>}
                </span>
              </div>
              {!isOpen && (
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => open(h.id)}
                >
                  Verify
                </button>
              )}
            </div>

            {isOpen && (
              <div className="verify">
                <div className="verify__row">
                  <label className="field">
                    <span className="field__label">Verification price</span>
                    <input
                      className="input mono"
                      type="number"
                      step="any"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder={String(h.entry_price)}
                      autoFocus
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">
                      Post-mortem note (optional)
                    </span>
                    <input
                      className="input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="What actually happened?"
                    />
                  </label>
                </div>
                {error && <p className="form__error">{error}</p>}
                <div className="verify__actions">
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={cancel}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => submit(h.id)}
                    disabled={submitting}
                  >
                    {submitting ? "Verifying…" : "Confirm"}
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
