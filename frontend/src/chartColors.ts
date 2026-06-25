/** Interpolate a hit-rate (0..1) from miss-red to hit-green. */
export function hitColor(rate: number): string {
  const red = [214, 69, 61];
  const green = [15, 157, 88];
  const mix = red.map((r, i) => Math.round(r + (green[i] - r) * rate));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

/** Background for a correlation cell: accent-blue for positive, red for negative. */
export function corrColor(v: number | null): string {
  if (v == null) return "var(--paper)";
  const strength = Math.round(Math.min(Math.abs(v), 1) * 70);
  const base = v >= 0 ? "var(--accent)" : "var(--miss)";
  return `color-mix(in srgb, ${base} ${strength}%, white)`;
}

/** Readable text color over a correlation cell. */
export function corrTextColor(v: number | null): string {
  if (v == null) return "var(--muted)";
  return Math.abs(v) > 0.55 ? "#ffffff" : "var(--ink)";
}

/** Short tag for a signal code, e.g. volume_breakout -> VB, is_hit -> HIT. */
export function abbrev(code: string): string {
  if (code === "is_hit") return "HIT";
  return code
    .split("_")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}
