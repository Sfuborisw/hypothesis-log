"""Demo reset: wipe the hypotheses table and reseed the baseline.

Used by a daily scheduled job so the public demo always returns to a
clean, owner-curated baseline — visitors can add/edit/delete freely,
and every day it resets.

Only clears hypotheses (and the join table); signals are left intact.
"""
import logging

from sqlalchemy import delete

from app.database import SessionLocal
from app.models import Hypothesis, hypothesis_signals
from app.seed_demo import seed_demo_hypotheses

logger = logging.getLogger("hyplog.reset")


def reset_demo() -> int:
    """Clear all hypotheses, then reseed the demo baseline.
    Returns the number of hypotheses seeded."""
    db = SessionLocal()
    try:
        # Clear the many-to-many bridge first (FK safety), then hypotheses.
        db.execute(delete(hypothesis_signals))
        db.execute(delete(Hypothesis))
        db.commit()
        logger.info("Cleared hypotheses table")
    except Exception:  # noqa: BLE001
        db.rollback()
        logger.exception("Failed to clear hypotheses")
        raise
    finally:
        db.close()

    count = seed_demo_hypotheses()
    logger.info("Demo reset complete: %d hypotheses reseeded", count)
    return count


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    reset_demo()
