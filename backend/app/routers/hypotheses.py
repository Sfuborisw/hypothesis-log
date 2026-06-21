from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.utils import timeframe_to_target_date
from app.verification import apply_verification

router = APIRouter(prefix="/hypotheses", tags=["hypotheses"])


def _resolve_signals(db: Session, signal_ids: list[int]) -> list[models.Signal]:
    """Turn a list of signal ids into ORM objects; 404 if any id is unknown."""
    if not signal_ids:
        return []
    signals = db.scalars(
        select(models.Signal).where(models.Signal.id.in_(signal_ids))
    ).all()
    missing = set(signal_ids) - {s.id for s in signals}
    if missing:
        raise HTTPException(404, f"Signal id(s) not found: {sorted(missing)}")
    return list(signals)


@router.post("", response_model=schemas.HypothesisRead, status_code=status.HTTP_201_CREATED)
def create_hypothesis(payload: schemas.HypothesisCreate, db: Session = Depends(get_db)):
    logged_on = payload.hypothesis_date or date.today()
    target = timeframe_to_target_date(logged_on, payload.timeframe)
    signals = _resolve_signals(db, payload.signal_ids)

    hyp = models.Hypothesis(
        ticker=payload.ticker.upper(),
        hypothesis_date=logged_on,
        action=payload.action,
        entry_price=payload.entry_price,
        predicted_direction=payload.predicted_direction,
        confidence=payload.confidence,
        timeframe=payload.timeframe,
        target_verification_date=target,
        reasoning=payload.reasoning,
        signals=signals,
    )
    db.add(hyp)
    db.commit()
    db.refresh(hyp)
    return hyp


@router.get("", response_model=list[schemas.HypothesisRead])
def list_hypotheses(
    status_filter: str | None = Query(None, alias="status"),
    ticker: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(models.Hypothesis).order_by(
        models.Hypothesis.hypothesis_date.desc(), models.Hypothesis.id.desc()
    )
    if status_filter:
        stmt = stmt.where(models.Hypothesis.status == status_filter)
    if ticker:
        stmt = stmt.where(models.Hypothesis.ticker == ticker.upper())
    return db.scalars(stmt).all()


@router.get("/{hypothesis_id}", response_model=schemas.HypothesisRead)
def get_hypothesis(hypothesis_id: int, db: Session = Depends(get_db)):
    hyp = db.get(models.Hypothesis, hypothesis_id)
    if not hyp:
        raise HTTPException(404, f"Hypothesis {hypothesis_id} not found")
    return hyp


@router.post("/{hypothesis_id}/verify", response_model=schemas.HypothesisRead)
def verify_hypothesis(
    hypothesis_id: int, payload: schemas.HypothesisVerify, db: Session = Depends(get_db)
):
    hyp = db.get(models.Hypothesis, hypothesis_id)
    if not hyp:
        raise HTTPException(404, f"Hypothesis {hypothesis_id} not found")
    if hyp.status == "verified":
        raise HTTPException(409, f"Hypothesis {hypothesis_id} is already verified")

    apply_verification(hyp, payload.verification_price, payload.post_notes)
    db.commit()
    db.refresh(hyp)
    return hyp


@router.delete("/{hypothesis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hypothesis(hypothesis_id: int, db: Session = Depends(get_db)):
    hyp = db.get(models.Hypothesis, hypothesis_id)
    if not hyp:
        raise HTTPException(404, f"Hypothesis {hypothesis_id} not found")
    db.delete(hyp)
    db.commit()