from datetime import datetime, timezone

from app.config import settings
from app.models import Hypothesis


def classify_direction(price_change_pct: float, threshold: float) -> str:
    """Bucket a % move into up / down / sideways using a +/- threshold band."""
    if price_change_pct > threshold:
        return "up"
    if price_change_pct < -threshold:
        return "down"
    return "sideways"


def apply_verification(
    hyp: Hypothesis,
    verification_price: float,
    post_notes: str | None = None,
) -> Hypothesis:
    """Fill verification fields + decide hit/miss. Mutates `hyp` in place.

    Shared by the manual /verify endpoint and (later) the yfinance scheduler,
    so the hit definition lives in exactly one place.
    """
    change_pct = (verification_price - hyp.entry_price) / hyp.entry_price * 100
    actual = classify_direction(change_pct, settings.sideways_threshold_pct)

    hyp.verification_price = verification_price
    hyp.price_change_pct = round(change_pct, 4)
    hyp.actual_direction = actual
    hyp.is_hit = 1 if actual == hyp.predicted_direction else 0
    hyp.status = "verified"
    hyp.verified_at = datetime.now(timezone.utc)
    if post_notes is not None:
        hyp.post_notes = post_notes
    return hyp