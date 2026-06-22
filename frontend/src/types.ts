// Mirrors the FastAPI/Pydantic schemas in backend/app/schemas.py.
// Keep these in sync with the backend contract.

export type Action = "observe" | "buy" | "sell" | "hold";
export type Direction = "up" | "down" | "sideways";
export type Timeframe = "1D" | "3D" | "1W" | "2W" | "1M" | "3M";
export type Category = "bullish" | "bearish" | "neutral";
export type HypothesisStatus = "pending" | "verified" | "cancelled";

export interface Signal {
  id: number;
  code: string;
  name: string;
  category: Category | null;
  description: string | null;
  created_at: string;
}

export interface SignalCreate {
  code: string;
  name: string;
  category?: Category | null;
  description?: string | null;
}

export interface Hypothesis {
  id: number;
  ticker: string;
  hypothesis_date: string; // ISO date (YYYY-MM-DD)
  action: Action;
  entry_price: number;
  predicted_direction: Direction;
  confidence: number; // 1..5
  timeframe: string;
  target_verification_date: string;
  reasoning: string | null;
  status: HypothesisStatus;
  verified_at: string | null;
  verification_price: number | null;
  actual_direction: Direction | null;
  price_change_pct: number | null;
  is_hit: number | null; // 0 | 1 | null
  post_notes: string | null;
  created_at: string;
  updated_at: string;
  signals: Signal[];
}

export interface HypothesisCreate {
  ticker: string;
  action: Action;
  entry_price: number;
  predicted_direction: Direction;
  confidence: number;
  timeframe: Timeframe;
  reasoning?: string | null;
  hypothesis_date?: string | null;
  signal_ids: number[];
}

export interface HypothesisVerify {
  verification_price: number;
  post_notes?: string | null;
}

export interface OverallStats {
  total_hypotheses: number;
  verified: number;
  pending: number;
  hits: number;
  misses: number;
  hit_rate: number | null;
  avg_price_change_pct: number | null;
}

export interface SignalBreakdown {
  signal_code: string;
  signal_name: string;
  n: number;
  hits: number;
  hit_rate: number;
}

export interface ConfidenceBreakdown {
  confidence: number;
  n: number;
  hits: number;
  hit_rate: number;
}

export interface SignalCorrelation {
  signal_code: string;
  signal_name: string;
  n: number;
  corr_with_hit: number | null;
}

export interface CorrelationResponse {
  per_signal: SignalCorrelation[];
  matrix: Record<string, Record<string, number | null>>;
  note: string | null;
}
