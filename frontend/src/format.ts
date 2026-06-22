/** Format a 0..1 ratio as a percentage, or an em-dash when null. */
export function pct(value: number | null): string {
  return value == null ? "—" : `${(value * 100).toFixed(1)}%`;
}

/** Format a signed number (e.g. +5.20 / -3.10), or an em-dash when null. */
export function signed(value: number | null, digits = 2): string {
  if (value == null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;
}
