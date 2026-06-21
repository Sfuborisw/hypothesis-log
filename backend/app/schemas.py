from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# Shared literal types -> nice validation + dropdowns in /docs
Action = Literal["observe", "buy", "sell", "hold"]
Direction = Literal["up", "down", "sideways"]
Timeframe = Literal["1D", "3D", "1W", "2W", "1M", "3M"]
Category = Literal["bullish", "bearish", "neutral"]


# ---------- Signal ----------
class SignalBase(BaseModel):
    code: str = Field(examples=["volume_breakout"])
    name: str = Field(examples=["Volume Breakout"])
    category: Optional[Category] = None
    description: Optional[str] = None


class SignalCreate(SignalBase):
    pass


class SignalRead(SignalBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ---------- Hypothesis ----------
class HypothesisCreate(BaseModel):
    ticker: str = Field(examples=["MU"])
    action: Action
    entry_price: float = Field(gt=0)
    predicted_direction: Direction
    confidence: int = Field(ge=1, le=5)
    timeframe: Timeframe
    reasoning: Optional[str] = None
    hypothesis_date: Optional[date] = None  # defaults to today server-side
    signal_ids: list[int] = Field(default_factory=list)


class HypothesisVerify(BaseModel):
    verification_price: float = Field(gt=0)
    post_notes: Optional[str] = None


class HypothesisRead(BaseModel):
    id: int
    ticker: str
    hypothesis_date: date
    action: Action
    entry_price: float
    predicted_direction: Direction
    confidence: int
    timeframe: str
    target_verification_date: date
    reasoning: Optional[str]
    status: str
    verified_at: Optional[datetime]
    verification_price: Optional[float]
    actual_direction: Optional[Direction]
    price_change_pct: Optional[float]
    is_hit: Optional[int]
    post_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    signals: list[SignalRead]
    model_config = ConfigDict(from_attributes=True)

# ---------- Analysis ----------
class OverallStats(BaseModel):
    total_hypotheses: int
    verified: int
    pending: int
    hits: int
    misses: int
    hit_rate: Optional[float]
    avg_price_change_pct: Optional[float]


class SignalBreakdown(BaseModel):
    signal_code: str
    signal_name: str
    n: int
    hits: int
    hit_rate: float


class ConfidenceBreakdown(BaseModel):
    confidence: int
    n: int
    hits: int
    hit_rate: float


class SignalCorrelation(BaseModel):
    signal_code: str
    signal_name: str
    n: int
    corr_with_hit: Optional[float]


class CorrelationResponse(BaseModel):
    per_signal: list[SignalCorrelation]
    matrix: dict[str, dict[str, Optional[float]]]
    note: Optional[str] = None