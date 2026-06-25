import { Fragment } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { useAsync } from "../useAsync";
import type {
  ConfidenceBreakdown,
  CorrelationResponse,
  SignalBreakdown,
} from "../types";
import { abbrev, corrColor, corrTextColor, hitColor } from "../chartColors";

interface Props {
  version: number; // bumps whenever data changes; triggers a re-fetch
  overallHitRate: number | null;
}

const pctTick = (v: number) => `${Math.round(v * 100)}%`;

// ---- by-signal hit rate (horizontal bars) ----
function SignalChart({ data }: { data: SignalBreakdown[] }) {
  if (data.length === 0) {
    return <p className="state">No verified hypotheses with signals yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 46)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 40, top: 4, bottom: 4 }}
      >
        <XAxis
          type="number"
          domain={[0, 1]}
          tickFormatter={pctTick}
          fontSize={12}
          stroke="var(--muted)"
        />
        <YAxis
          type="category"
          dataKey="signal_name"
          width={150}
          fontSize={12}
          stroke="var(--muted)"
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--paper)" }}
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const d = payload[0].payload as SignalBreakdown;
            return (
              <div className="tip">
                <div className="tip__title">{d.signal_name}</div>
                <div className="tip__row">Hit rate: {pctTick(d.hit_rate)}</div>
                <div className="tip__row">
                  {d.hits}/{d.n} verified
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="hit_rate" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={hitColor(d.hit_rate)} />
          ))}
          <LabelList
            dataKey="hit_rate"
            position="right"
            fontSize={12}
            formatter={(value: unknown) =>
              typeof value === "number" ? pctTick(value) : ""
            }
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---- by-confidence hit rate (vertical bars + calibration line) ----
function ConfidenceChart({
  data,
  overallHitRate,
}: {
  data: ConfidenceBreakdown[];
  overallHitRate: number | null;
}) {
  if (data.length === 0) {
    return <p className="state">No verified hypotheses yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 4 }}>
        <XAxis
          dataKey="confidence"
          tickFormatter={(v) => `${v}/5`}
          fontSize={12}
          stroke="var(--muted)"
        />
        <YAxis
          domain={[0, 1]}
          tickFormatter={pctTick}
          fontSize={12}
          stroke="var(--muted)"
        />
        {overallHitRate != null && (
          <ReferenceLine
            y={overallHitRate}
            stroke="var(--muted)"
            strokeDasharray="4 4"
            label={{
              value: `overall ${pctTick(overallHitRate)}`,
              position: "insideTopRight",
              fontSize: 11,
              fill: "var(--muted)",
            }}
          />
        )}
        <Tooltip
          cursor={{ fill: "var(--paper)" }}
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const d = payload[0].payload as ConfidenceBreakdown;
            return (
              <div className="tip">
                <div className="tip__title">Confidence {d.confidence}/5</div>
                <div className="tip__row">Hit rate: {pctTick(d.hit_rate)}</div>
                <div className="tip__row">
                  {d.hits}/{d.n} verified
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="hit_rate" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={hitColor(d.hit_rate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---- signal x hit correlation heatmap ----
function CorrelationHeatmap({ data }: { data: CorrelationResponse }) {
  const labels = Object.keys(data.matrix);
  if (labels.length === 0) {
    return (
      <p className="state">
        {data.note ?? "Not enough data for correlation yet."}
      </p>
    );
  }
  return (
    <div className="heatmap-wrap">
      <div
        className="heatmap"
        style={{
          gridTemplateColumns: `var(--hm-label) repeat(${labels.length}, minmax(38px, 1fr))`,
        }}
      >
        <div className="heatmap__corner" />
        {labels.map((l) => (
          <div className="heatmap__colhead mono" key={`col-${l}`}>
            {abbrev(l)}
          </div>
        ))}
        {labels.map((rowKey) => (
          <Fragment key={`row-${rowKey}`}>
            <div className="heatmap__rowhead mono">{abbrev(rowKey)}</div>
            {labels.map((colKey) => {
              const v = data.matrix[rowKey][colKey];
              return (
                <div
                  className="heatmap__cell mono"
                  key={`${rowKey}-${colKey}`}
                  style={{ background: corrColor(v), color: corrTextColor(v) }}
                  title={`${abbrev(rowKey)} × ${abbrev(colKey)}: ${v == null ? "n/a" : v.toFixed(2)}`}
                >
                  {v == null ? "·" : v.toFixed(2)}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      <div className="heatmap__legend">
        {data.per_signal.map((s) => (
          <span className="heatmap__key" key={s.signal_code}>
            <span className="mono heatmap__keytag">
              {abbrev(s.signal_code)}
            </span>
            {s.signal_name}
          </span>
        ))}
        <span className="heatmap__key">
          <span className="mono heatmap__keytag">HIT</span>was the call correct
        </span>
      </div>
      {data.note && <p className="state heatmap__note">{data.note}</p>}
    </div>
  );
}

export function Dashboard({ version, overallHitRate }: Props) {
  const bySignal = useAsync<SignalBreakdown[]>(() => api.bySignal(), [version]);
  const byConfidence = useAsync<ConfidenceBreakdown[]>(
    () => api.byConfidence(),
    [version],
  );
  const correlation = useAsync<CorrelationResponse>(
    () => api.correlation(),
    [version],
  );

  return (
    <div className="dash">
      <div className="dash__grid">
        <div className="dash__card">
          <h3 className="dash__title">Hit rate by signal</h3>
          <p className="dash__sub">Which signals are actually your edge.</p>
          {bySignal.loading && <p className="state">Loading…</p>}
          {bySignal.error && (
            <p className="state state--error">{bySignal.error}</p>
          )}
          {bySignal.data && <SignalChart data={bySignal.data} />}
        </div>

        <div className="dash__card">
          <h3 className="dash__title">Hit rate by confidence</h3>
          <p className="dash__sub">Is your conviction calibrated?</p>
          {byConfidence.loading && <p className="state">Loading…</p>}
          {byConfidence.error && (
            <p className="state state--error">{byConfidence.error}</p>
          )}
          {byConfidence.data && (
            <ConfidenceChart
              data={byConfidence.data}
              overallHitRate={overallHitRate}
            />
          )}
        </div>
      </div>

      <div className="dash__card">
        <h3 className="dash__title">Signal × hit correlation</h3>
        <p className="dash__sub">
          Blue = tends to hit together · red = tends to miss. Read the{" "}
          <span className="mono">HIT</span> row to see each signal’s pull on
          success.
        </p>
        {correlation.loading && <p className="state">Loading…</p>}
        {correlation.error && (
          <p className="state state--error">{correlation.error}</p>
        )}
        {correlation.data && <CorrelationHeatmap data={correlation.data} />}
      </div>
    </div>
  );
}
