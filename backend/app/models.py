from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    ForeignKey,
    Table,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# Many-to-many bridge: a hypothesis can carry several signals
hypothesis_signals = Table(
    "hypothesis_signals",
    Base.metadata,
    Column("hypothesis_id", ForeignKey("hypotheses.id", ondelete="CASCADE"), primary_key=True),
    Column("signal_id", ForeignKey("signals.id", ondelete="CASCADE"), primary_key=True),
)


class Signal(Base):
    __tablename__ = "signals"
    __table_args__ = (
        CheckConstraint("category IN ('bullish','bearish','neutral')", name="ck_signal_category"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(unique=True)          # 'volume_breakout'
    name: Mapped[str] = mapped_column(unique=True)          # 'Volume Breakout'
    category: Mapped[str | None]
    description: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    hypotheses: Mapped[list["Hypothesis"]] = relationship(
        secondary=hypothesis_signals, back_populates="signals"
    )


class Hypothesis(Base):
    __tablename__ = "hypotheses"
    __table_args__ = (
        CheckConstraint("action IN ('observe','buy','sell','hold')", name="ck_action"),
        CheckConstraint("predicted_direction IN ('up','down','sideways')", name="ck_pred_dir"),
        CheckConstraint("confidence BETWEEN 1 AND 5", name="ck_confidence"),
        CheckConstraint("status IN ('pending','verified','cancelled')", name="ck_status"),
        CheckConstraint("actual_direction IN ('up','down','sideways')", name="ck_actual_dir"),
        CheckConstraint("is_hit IN (0,1)", name="ck_is_hit"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    # Core observation
    ticker: Mapped[str]
    hypothesis_date: Mapped[date] = mapped_column(default=date.today)
    action: Mapped[str]
    entry_price: Mapped[float]

    # Prediction
    predicted_direction: Mapped[str]
    confidence: Mapped[int]
    timeframe: Mapped[str]                                  # '1D' / '1W' / '1M'
    target_verification_date: Mapped[date]                 # drives the scheduler
    reasoning: Mapped[str | None]

    # Verification (NULL until verified)
    status: Mapped[str] = mapped_column(default="pending")
    verified_at: Mapped[datetime | None]
    verification_price: Mapped[float | None]
    actual_direction: Mapped[str | None]
    price_change_pct: Mapped[float | None]
    is_hit: Mapped[int | None]
    post_notes: Mapped[str | None]

    # Audit
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    signals: Mapped[list["Signal"]] = relationship(
        secondary=hypothesis_signals, back_populates="hypotheses"
    )

