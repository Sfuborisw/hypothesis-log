"""Populate the signal catalog with a starter set. Safe to re-run."""
from sqlalchemy import select

from app import models
from app.database import Base, SessionLocal, engine

SEED_SIGNALS = [
    {"code": "volume_breakout", "name": "Volume Breakout", "category": "bullish"},
    {"code": "gap_up_fade", "name": "Gap Up, Fade Down", "category": "bearish"},
    {"code": "spike_reversal", "name": "Spike and Reverse", "category": "bearish"},
    {"code": "fake_breakout", "name": "Fake Breakout", "category": "bearish"},
    {"code": "support_break", "name": "Break Below Support", "category": "bearish"},
    {"code": "lockup_expiry", "name": "Lockup Expiry Pressure", "category": "bearish"},
]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        added = 0
        for item in SEED_SIGNALS:
            if db.scalar(select(models.Signal).where(models.Signal.code == item["code"])):
                continue
            db.add(models.Signal(**item))
            added += 1
        db.commit()
        total = len(db.scalars(select(models.Signal)).all())
        print(f"Seeded {added} new signal(s); catalog now has {total} total.")


if __name__ == "__main__":
    main()