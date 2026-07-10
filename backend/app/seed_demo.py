"""Seed the database with demo hypotheses for the public live demo.

Mirrors POE2's seed_tax_rates.py pattern: open a session, upsert rows,
commit. Run standalone (python -m app.seed_demo) or import
seed_demo_hypotheses() from the reset job.

The data here is illustrative — common large-cap names with textbook
reasoning — NOT the owner's real trading positions. Some are already
verified (hit/miss) so the analysis endpoints show meaningful stats;
some are still pending so the verification flow is visible.
"""
import datetime as dt

from app.database import SessionLocal, Base, engine
from app.models import Hypothesis  # adjust import if your model lives elsewhere


def _d(days_from_today: int) -> dt.date:
    return dt.date.today() + dt.timedelta(days=days_from_today)


# Each dict is one demo hypothesis. Verified ones carry outcome fields.
DEMO_HYPOTHESES = [
    {
        "ticker": "MU",
        "action": "buy",
        "entry_price": 145.0,
        "predicted_direction": "up",
        "confidence": 4,
        "timeframe": "1M",
        "hypothesis_date": _d(-40),
        "target_verification_date": _d(-10),
        "reasoning": "HBM demand from AI accelerators tightening DRAM supply.",
        "status": "verified",
        "verified_at": dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=10),
        "verification_price": 168.0,
        "actual_direction": "up",
        "price_change_pct": 15.9,
        "is_hit": 1,
        "post_notes": "Thesis played out; supply tightness confirmed by guidance.",
    },
    {
        "ticker": "NVDA",
        "action": "buy",
        "entry_price": 178.0,
        "predicted_direction": "up",
        "confidence": 5,
        "timeframe": "1M",
        "hypothesis_date": _d(-35),
        "target_verification_date": _d(-5),
        "reasoning": "Data-center capex cycle still accelerating into next quarter.",
        "status": "verified",
        "verified_at": dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=5),
        "verification_price": 195.0,
        "actual_direction": "up",
        "price_change_pct": 9.6,
        "is_hit": 1,
        "post_notes": "Momentum held through earnings.",
    },
    {
        "ticker": "TSM",
        "action": "buy",
        "entry_price": 210.0,
        "predicted_direction": "up",
        "confidence": 3,
        "timeframe": "1W",
        "hypothesis_date": _d(-20),
        "target_verification_date": _d(-13),
        "reasoning": "Advanced-node pricing power ahead of quarterly update.",
        "status": "verified",
        "verified_at": dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=13),
        "verification_price": 202.0,
        "actual_direction": "down",
        "price_change_pct": -3.8,
        "is_hit": 0,
        "post_notes": "Missed — broad semi pullback overrode the thesis.",
    },
    {
        "ticker": "AMD",
        "action": "observe",
        "entry_price": 165.0,
        "predicted_direction": "sideways",
        "confidence": 2,
        "timeframe": "2W",
        "hypothesis_date": _d(-18),
        "target_verification_date": _d(-4),
        "reasoning": "Range-bound pending MI-series traction signals.",
        "status": "verified",
        "verified_at": dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=4),
        "verification_price": 167.0,
        "actual_direction": "sideways",
        "price_change_pct": 1.2,
        "is_hit": 1,
        "post_notes": "Consolidated as expected.",
    },
    {
        "ticker": "MU",
        "action": "buy",
        "entry_price": 172.0,
        "predicted_direction": "up",
        "confidence": 4,
        "timeframe": "1M",
        "hypothesis_date": _d(-5),
        "target_verification_date": _d(25),
        "reasoning": "Follow-through on HBM3E ramp into next earnings.",
        "status": "pending",
    },
    {
        "ticker": "AVGO",
        "action": "buy",
        "entry_price": 340.0,
        "predicted_direction": "up",
        "confidence": 3,
        "timeframe": "3M",
        "hypothesis_date": _d(-3),
        "target_verification_date": _d(85),
        "reasoning": "Custom-silicon backlog supports multi-quarter growth.",
        "status": "pending",
    },
]


def seed_demo_hypotheses() -> int:
    """Insert the demo hypotheses. Returns the number inserted.
    Assumes the table is already empty (the reset job clears it first)."""
    Base.metadata.create_all(bind=engine)  # ensure tables exist
    db = SessionLocal()
    inserted = 0
    try:
        for row in DEMO_HYPOTHESES:
            db.add(Hypothesis(**row))
            inserted += 1
        db.commit()
        print(f"✅ Seeded {inserted} demo hypotheses.")
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        print(f"❌ Seed failed: {exc}")
        raise
    finally:
        db.close()
    return inserted


if __name__ == "__main__":
    seed_demo_hypotheses()
