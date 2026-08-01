import { useState } from "react";
import { api, ApiError } from "../api";
import type {
  Action,
  Direction,
  Hypothesis,
  Signal,
  Timeframe,
} from "../types";
import { Modal } from "./Modal";

const ACTIONS: Action[] = ["observe", "buy", "sell", "hold"];
const DIRECTIONS: Direction[] = ["up", "down", "sideways"];
const TIMEFRAMES: Timeframe[] = ["1D", "3D", "1W", "2W", "1M", "3M"];
const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5];
const DIR_GLYPH: Record<Direction, string> = {
  up: "▲",
  down: "▼",
  sideways: "▶",
};

interface Props {
  hypothesis: Hypothesis;
  signals: Signal[];
  onClose: () => void;
  onChanged: () => void;
}

interface FormState {
  ticker: string;
  action: Action;
  entry_price: string;
  predicted_direction: Direction;
  confidence: number;
  timeframe: Timeframe;
  reasoning: string;
  signal_ids: number[];
}

function initForm(h: Hypothesis): FormState {
  return {
    ticker: h.ticker,
    action: h.action,
    entry_price: String(h.entry_price),
    predicted_direction: h.predicted_direction,
    confidence: h.confidence,
    timeframe: h.timeframe as Timeframe,
    reasoning: h.reasoning ?? "",
    signal_ids: h.signals.map((s) => s.id),
  };
}

type Busy = "idle" | "saving" | "verifying" | "deleting";

export function HypothesisDetailModal({
  hypothesis,
  signals,
  onClose,
  onChanged,
}: Props) {
  const [form, setForm] = useState<FormState>(() => initForm(hypothesis));
  const [verifyPrice, setVerifyPrice] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<Busy>("idle");
  const [error, setError] = useState<string | null>(null);

  const disabled = busy !== "idle";

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function toggleSignal(id: number) {
    setForm((f) => ({
      ...f,
      signal_ids: f.signal_ids.includes(id)
        ? f.signal_ids.filter((s) => s !== id)
        : [...f.signal_ids, id],
    }));
  }

  async function save(close: () => void) {
    const price = Number(form.entry_price);
    if (!form.ticker.trim()) {
      setError("Ticker is required.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Entry price must be a positive number.");
      return;
    }
    setBusy("saving");
    setError(null);
    try {
      await api.updateHypothesis(hypothesis.id, {
        ticker: form.ticker.trim().toUpperCase(),
        action: form.action,
        entry_price: price,
        predicted_direction: form.predicted_direction,
        confidence: form.confidence,
        timeframe: form.timeframe,
        reasoning: form.reasoning.trim() || null,
        signal_ids: form.signal_ids,
      });
      onChanged();
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save.");
      setBusy("idle");
    }
  }

  async function verify(close: () => void) {
    const price = Number(verifyPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Verification price must be a positive number.");
      return;
    }
    setBusy("verifying");
    setError(null);
    try {
      await api.verifyHypothesis(hypothesis.id, {
        verification_price: price,
        post_notes: verifyNotes.trim() || null,
      });
      onChanged();
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to verify.");
      setBusy("idle");
    }
  }

  async function remove(close: () => void) {
    setBusy("deleting");
    setError(null);
    try {
      await api.deleteHypothesis(hypothesis.id);
      onChanged();
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete.");
      setBusy("idle");
    }
  }

  return (
    <Modal title={`${hypothesis.ticker} · edit hypothesis`} onClose={onClose}>
      {(close) => (
        <div className="form">
          <div className="form__row">
            <label className="field">
              <span className="field__label">Ticker</span>
              <input
                className="input mono"
                value={form.ticker}
                onChange={(e) => update("ticker", e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Entry price</span>
              <input
                className="input mono"
                type="number"
                step="any"
                min="0"
                value={form.entry_price}
                onChange={(e) => update("entry_price", e.target.value)}
              />
            </label>
          </div>
          <div className="form__row">
            <label className="field">
              <span className="field__label">Action</span>
              <select
                className="select"
                value={form.action}
                onChange={(e) => update("action", e.target.value as Action)}
              >
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Timeframe</span>
              <select
                className="select"
                value={form.timeframe}
                onChange={(e) =>
                  update("timeframe", e.target.value as Timeframe)
                }
              >
                {TIMEFRAMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field">
            <span className="field__label">Predicted direction</span>
            <div className="segment">
              {DIRECTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`segment__btn ${form.predicted_direction === d ? "segment__btn--active" : ""}`}
                  onClick={() => update("predicted_direction", d)}
                >
                  <span className="mono">{DIR_GLYPH[d]}</span> {d}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field__label">Confidence</span>
            <div className="segment">
              {CONFIDENCE_LEVELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`segment__btn mono ${form.confidence === c ? "segment__btn--active" : ""}`}
                  onClick={() => update("confidence", c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field__label">Signals</span>
            <div className="chips">
              {signals.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`chip ${form.signal_ids.includes(s.id) ? "chip--active" : ""}`}
                  onClick={() => toggleSignal(s.id)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <label className="field">
            <span className="field__label">Reasoning / gut feel</span>
            <textarea
              className="input textarea"
              value={form.reasoning}
              onChange={(e) => update("reasoning", e.target.value)}
              rows={3}
            />
          </label>

          {error && <p className="form__error">{error}</p>}

          <div className="modal__actions">
            {confirmDelete ? (
              <span className="rowconfirm">
                <button
                  className="btn btn--sm btn--danger"
                  onClick={() => remove(close)}
                  disabled={disabled}
                >
                  {busy === "deleting" ? "Deleting…" : "Confirm delete"}
                </button>
                <button
                  className="btn btn--sm btn--ghost"
                  onClick={() => setConfirmDelete(false)}
                  disabled={disabled}
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                className="btn btn--sm btn--dangerghost"
                onClick={() => {
                  setConfirmDelete(true);
                  setError(null);
                }}
                disabled={disabled}
              >
                Delete
              </button>
            )}
            <div className="modal__actions-right">
              <button
                className="btn btn--ghost"
                onClick={close}
                disabled={disabled}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={() => save(close)}
                disabled={disabled}
              >
                {busy === "saving" ? "Saving…" : "Save edits"}
              </button>
            </div>
          </div>

          <div className="modal__verify">
            <span className="modal__verify-title">Verify this hypothesis</span>
            <div className="verify__row">
              <label className="field">
                <span className="field__label">Verification price</span>
                <input
                  className="input mono"
                  type="number"
                  step="any"
                  min="0"
                  value={verifyPrice}
                  onChange={(e) => setVerifyPrice(e.target.value)}
                  placeholder={String(hypothesis.entry_price)}
                />
              </label>
              <label className="field">
                <span className="field__label">
                  Post-mortem note (optional)
                </span>
                <input
                  className="input"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="What actually happened?"
                />
              </label>
            </div>
            <div className="modal__actions-right">
              <button
                className="btn btn--verify"
                onClick={() => verify(close)}
                disabled={disabled}
              >
                {busy === "verifying" ? "Verifying…" : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
