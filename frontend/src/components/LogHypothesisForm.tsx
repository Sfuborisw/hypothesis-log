import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import type { Action, Direction, Signal, Timeframe } from "../types";

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
  signals: Signal[];
  onCreated: () => void;
}

interface FormState {
  ticker: string;
  action: Action;
  entry_price: string; // kept as string for the input; parsed on submit
  predicted_direction: Direction;
  confidence: number;
  timeframe: Timeframe;
  reasoning: string;
  signal_ids: number[];
}

const EMPTY: FormState = {
  ticker: "",
  action: "observe",
  entry_price: "",
  predicted_direction: "up",
  confidence: 3,
  timeframe: "1W",
  reasoning: "",
  signal_ids: [],
};

export function LogHypothesisForm({ signals, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const price = Number(form.entry_price);
    if (!form.ticker.trim()) {
      setError("Ticker is required.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError("Entry price must be a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createHypothesis({
        ticker: form.ticker.trim().toUpperCase(),
        action: form.action,
        entry_price: price,
        predicted_direction: form.predicted_direction,
        confidence: form.confidence,
        timeframe: form.timeframe,
        reasoning: form.reasoning.trim() || null,
        signal_ids: form.signal_ids,
      });
      setForm(EMPTY);
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to log hypothesis.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form__row">
        <label className="field">
          <span className="field__label">Ticker</span>
          <input
            className="input mono"
            value={form.ticker}
            onChange={(e) => update("ticker", e.target.value)}
            placeholder="MU"
            autoCapitalize="characters"
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
            placeholder="100.00"
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
            onChange={(e) => update("timeframe", e.target.value as Timeframe)}
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
        <span className="field__label">
          Signals{" "}
          {form.signal_ids.length > 0 && (
            <span className="field__hint">
              ({form.signal_ids.length} selected)
            </span>
          )}
        </span>
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
          placeholder="What does your intuition say, and why?"
          rows={3}
        />
      </label>

      {error && <p className="form__error">{error}</p>}

      <div className="form__actions">
        <button
          className="btn btn--primary"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Logging…" : "Log hypothesis"}
        </button>
      </div>
    </form>
  );
}
