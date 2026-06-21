"""pandas analysis layer.

Pure functions: take ORM data, return plain dicts (JSON-ready, no numpy types).
This is the data-analysis core of the project — hit-rate breakdowns by signal
and confidence, plus a signal/hit correlation matrix.
"""
from __future__ import annotations

import math

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app import models


def load_frames(db: Session) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load hypotheses + their signal tags into two tidy DataFrames.

    Returns
    -------
    hyp_df  : one row per hypothesis (id, status, is_hit, confidence, ...)
    link_df : one row per (hypothesis, signal) pair
    """
    hyps = db.scalars(
        select(models.Hypothesis).options(selectinload(models.Hypothesis.signals))
    ).all()

    hyp_df = pd.DataFrame(
        [
            {
                "id": h.id,
                "ticker": h.ticker,
                "predicted_direction": h.predicted_direction,
                "confidence": h.confidence,
                "status": h.status,
                "is_hit": h.is_hit,
                "price_change_pct": h.price_change_pct,
            }
            for h in hyps
        ],
        columns=["id", "ticker", "predicted_direction", "confidence",
                 "status", "is_hit", "price_change_pct"],
    )

    link_df = pd.DataFrame(
        [
            {"hypothesis_id": h.id, "signal_code": s.code, "signal_name": s.name}
            for h in hyps
            for s in h.signals
        ],
        columns=["hypothesis_id", "signal_code", "signal_name"],
    )
    return hyp_df, link_df


def _verified(hyp_df: pd.DataFrame) -> pd.DataFrame:
    """Subset of hypotheses that have been verified (is_hit is 0/1)."""
    if hyp_df.empty:
        return hyp_df
    v = hyp_df[hyp_df["status"] == "verified"].copy()
    v["is_hit"] = v["is_hit"].astype(int)
    return v


def overall_stats(hyp_df: pd.DataFrame) -> dict:
    total = int(len(hyp_df))
    v = _verified(hyp_df)
    n = int(len(v))
    hits = int(v["is_hit"].sum()) if n else 0
    pending = int((hyp_df["status"] == "pending").sum()) if total else 0
    return {
        "total_hypotheses": total,
        "verified": n,
        "pending": pending,
        "hits": hits,
        "misses": n - hits,
        "hit_rate": round(hits / n, 4) if n else None,
        "avg_price_change_pct": round(float(v["price_change_pct"].mean()), 4) if n else None,
    }


def by_signal(hyp_df: pd.DataFrame, link_df: pd.DataFrame) -> list[dict]:
    """Hit rate per signal (the 'which signals are my edge' view)."""
    v = _verified(hyp_df)
    if v.empty or link_df.empty:
        return []
    merged = link_df.merge(v, left_on="hypothesis_id", right_on="id", how="inner")
    if merged.empty:
        return []
    g = (
        merged.groupby(["signal_code", "signal_name"])["is_hit"]
        .agg(n="count", hits="sum")
        .reset_index()
    )
    g["hit_rate"] = (g["hits"] / g["n"]).round(4)
    g = g.sort_values(["hit_rate", "n"], ascending=[False, False])
    return [
        {
            "signal_code": r.signal_code,
            "signal_name": r.signal_name,
            "n": int(r.n),
            "hits": int(r.hits),
            "hit_rate": float(r.hit_rate),
        }
        for r in g.itertuples()
    ]


def by_confidence(hyp_df: pd.DataFrame) -> list[dict]:
    """Hit rate per confidence level (is my confidence calibrated?)."""
    v = _verified(hyp_df)
    if v.empty:
        return []
    g = (
        v.groupby("confidence")["is_hit"]
        .agg(n="count", hits="sum")
        .reset_index()
        .sort_values("confidence")
    )
    g["hit_rate"] = (g["hits"] / g["n"]).round(4)
    return [
        {
            "confidence": int(r.confidence),
            "n": int(r.n),
            "hits": int(r.hits),
            "hit_rate": float(r.hit_rate),
        }
        for r in g.itertuples()
    ]


def _clean(x) -> float | None:
    """NaN -> None so the payload is valid JSON."""
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else round(float(x), 4)


def signal_hit_correlation(hyp_df: pd.DataFrame, link_df: pd.DataFrame) -> dict:
    """Correlation between each signal's presence and hitting (phi coefficient),
    plus the full signal/hit correlation matrix for a heatmap."""
    v = _verified(hyp_df)[["id", "is_hit"]]
    note = None
    if len(v) < 2 or link_df.empty:
        return {"per_signal": [], "matrix": {}, "note": "Not enough verified data yet."}

    # one-hot: rows = hypotheses, cols = signal_code (1 if present)
    onehot = pd.crosstab(link_df["hypothesis_id"], link_df["signal_code"])
    onehot = (onehot > 0).astype(int)

    df = v.set_index("id").join(onehot, how="left").fillna(0)
    df["is_hit"] = df["is_hit"].astype(int)

    signal_cols = [c for c in df.columns if c != "is_hit"]
    name_map = dict(zip(link_df["signal_code"], link_df["signal_name"]))

    per_signal = []
    for c in signal_cols:
        n = int(df[c].sum())
        corr = None if df[c].nunique() < 2 else df[c].corr(df["is_hit"])
        per_signal.append(
            {
                "signal_code": c,
                "signal_name": name_map.get(c, c),
                "n": n,
                "corr_with_hit": _clean(corr),
            }
        )
    per_signal.sort(
        key=lambda d: (d["corr_with_hit"] is not None, d["corr_with_hit"] or 0),
        reverse=True,
    )

    corr_df = df[signal_cols + ["is_hit"]].corr()
    matrix = {row: {col: _clean(corr_df.loc[row, col]) for col in corr_df.columns}
              for row in corr_df.index}

    if len(v) < 5:
        note = "Sample size is small; correlations are indicative only."
    return {"per_signal": per_signal, "matrix": matrix, "note": note}