from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/signals", tags=["signals"])


@router.post("", response_model=schemas.SignalRead, status_code=status.HTTP_201_CREATED)
def create_signal(payload: schemas.SignalCreate, db: Session = Depends(get_db)):
    exists = db.scalar(select(models.Signal).where(models.Signal.code == payload.code))
    if exists:
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"Signal code '{payload.code}' already exists"
        )
    signal = models.Signal(**payload.model_dump())
    db.add(signal)
    db.commit()
    db.refresh(signal)
    return signal


@router.get("", response_model=list[schemas.SignalRead])
def list_signals(db: Session = Depends(get_db)):
    return db.scalars(select(models.Signal).order_by(models.Signal.name)).all()