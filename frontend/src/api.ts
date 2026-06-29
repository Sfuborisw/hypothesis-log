import type {
  Signal,
  SignalCreate,
  Hypothesis,
  HypothesisCreate,
  HypothesisVerify,
  OverallStats,
  SignalBreakdown,
  ConfidenceBreakdown,
  CorrelationResponse,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let detail: string = res.statusText;
    try {
      const body = await res.json();
      detail =
        typeof body.detail === "string"
          ? body.detail
          : JSON.stringify(body.detail);
    } catch {
      // non-JSON error body; keep statusText
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // ---- signals ----
  listSignals: () => request<Signal[]>("/signals"),
  createSignal: (body: SignalCreate) =>
    request<Signal>("/signals", { method: "POST", body: JSON.stringify(body) }),

  // ---- hypotheses ----
  listHypotheses: (params: { status?: string; ticker?: string } = {}) => {
    const entries = Object.entries(params).filter(
      ([, v]) => v != null && v !== "",
    ) as [string, string][];
    const qs = new URLSearchParams(entries).toString();
    return request<Hypothesis[]>(`/hypotheses${qs ? `?${qs}` : ""}`);
  },
  getHypothesis: (id: number) => request<Hypothesis>(`/hypotheses/${id}`),
  createHypothesis: (body: HypothesisCreate) =>
    request<Hypothesis>("/hypotheses", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  verifyHypothesis: (id: number, body: HypothesisVerify) =>
    request<Hypothesis>(`/hypotheses/${id}/verify`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteHypothesis: (id: number) =>
    request<void>(`/hypotheses/${id}`, { method: "DELETE" }),

  // ---- analysis ----
  overall: () => request<OverallStats>("/analysis/overall"),
  bySignal: () => request<SignalBreakdown[]>("/analysis/by-signal"),
  byConfidence: () => request<ConfidenceBreakdown[]>("/analysis/by-confidence"),
  correlation: () => request<CorrelationResponse>("/analysis/correlation"),
};
