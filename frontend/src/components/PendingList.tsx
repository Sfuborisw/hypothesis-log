import { useState } from "react";
import type { Direction, Hypothesis, Signal } from "../types";
import { HypothesisDetailModal } from "./HypothesisDetailModal";

const DIR_GLYPH: Record<Direction, string> = {
  up: "▲",
  down: "▼",
  sideways: "▶",
};

function isDue(targetDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return targetDate <= today;
}

interface Props {
  pending: Hypothesis[];
  signals: Signal[];
  onChanged: () => void;
}

export function PendingList({ pending, signals, onChanged }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (pending.length === 0) {
    return <p className="state">Nothing awaiting verification.</p>;
  }

  const active = pending.find((h) => h.id === openId) ?? null;

  return (
    <>
      <ul className="queue">
        {pending.map((h) => {
          const due = isDue(h.target_verification_date);
          return (
            <li key={h.id}>
              <button
                type="button"
                className={`queue__item queue__item--clickable ${due ? "queue__item--due" : ""}`}
                onClick={() => setOpenId(h.id)}
              >
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
                <span className="queue__chevron" aria-hidden>
                  ›
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {active && (
        <HypothesisDetailModal
          hypothesis={active}
          signals={signals}
          onClose={() => setOpenId(null)}
          onChanged={onChanged}
        />
      )}
    </>
  );
}
