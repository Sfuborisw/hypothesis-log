import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverallReadout } from "./OverallReadout";
import type { OverallStats } from "../types";

// A baseline stats object; override per test.
function makeStats(overrides: Partial<OverallStats> = {}): OverallStats {
  return {
    total_hypotheses: 10,
    verified: 8,
    pending: 2,
    hits: 6,
    misses: 2,
    hit_rate: 0.75,
    avg_price_change_pct: 3.2,
    ...overrides,
  };
}

describe("OverallReadout", () => {
  it("renders every stat label", () => {
    render(<OverallReadout stats={makeStats()} />);
    for (const label of [
      "Hit rate",
      "Verified",
      "Hits",
      "Misses",
      "Pending",
      "Total logged",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("shows the raw counts from the stats", () => {
    render(
      <OverallReadout
        stats={makeStats({
          verified: 8,
          hits: 6,
          misses: 2,
          pending: 2,
          total_hypotheses: 10,
        })}
      />,
    );
    expect(screen.getByText("8")).toBeInTheDocument(); // verified
    expect(screen.getByText("6")).toBeInTheDocument(); // hits
    expect(screen.getByText("10")).toBeInTheDocument(); // total
  });

  it("formats the hit rate as a percentage", () => {
    render(<OverallReadout stats={makeStats({ hit_rate: 0.75 })} />);
    // pct() should turn 0.75 into a percentage string containing 75
    expect(screen.getByText(/75/)).toBeInTheDocument();
  });

  it("does not crash when hit_rate is null (no verified hypotheses yet)", () => {
    // New users have nothing verified, so hit_rate comes back null.
    // The component must still render without throwing.
    render(
      <OverallReadout
        stats={makeStats({ hit_rate: null, verified: 0, hits: 0, misses: 0 })}
      />,
    );
    expect(screen.getByText("Hit rate")).toBeInTheDocument();
  });

  it("handles an all-zero (empty log) state", () => {
    render(
      <OverallReadout
        stats={makeStats({
          total_hypotheses: 0,
          verified: 0,
          pending: 0,
          hits: 0,
          misses: 0,
          hit_rate: null,
          avg_price_change_pct: null,
        })}
      />,
    );
    // Six stat cells should still render.
    expect(screen.getByText("Total logged")).toBeInTheDocument();
  });

  it("marks the hit rate as the accented value", () => {
    const { container } = render(
      <OverallReadout stats={makeStats({ hit_rate: 0.75 })} />,
    );
    const accent = container.querySelector(".stat__value--accent");
    expect(accent).not.toBeNull();
  });
});
