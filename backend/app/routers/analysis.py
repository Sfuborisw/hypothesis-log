from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import analysis, schemas
from app.database import get_db

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/overall", response_model=schemas.OverallStats)
def overall(db: Session = Depends(get_db)):
    hyp_df, _ = analysis.load_frames(db)
    return analysis.overall_stats(hyp_df)


@router.get("/by-signal", response_model=list[schemas.SignalBreakdown])
def by_signal(db: Session = Depends(get_db)):
    hyp_df, link_df = analysis.load_frames(db)
    return analysis.by_signal(hyp_df, link_df)


@router.get("/by-confidence", response_model=list[schemas.ConfidenceBreakdown])
def by_confidence(db: Session = Depends(get_db)):
    hyp_df, _ = analysis.load_frames(db)
    return analysis.by_confidence(hyp_df)


@router.get("/correlation", response_model=schemas.CorrelationResponse)
def correlation(db: Session = Depends(get_db)):
    hyp_df, link_df = analysis.load_frames(db)
    return analysis.signal_hit_correlation(hyp_df, link_df)