/**
 * Properties that store a cumulative running total (odometer-style).
 * To get consumption over a time range, compute last() per window then difference().
 * Never use mean() on these — the average of cumulative values is meaningless.
 */
export const CUMULATIVE_PROPERTIES = new Set([
  "driverEnergyConsumption",
  "driverOperationTime",
  "lampOperationTime",
]);

/**
 * Returns an InfluxDB duration string that yields ~10 points per hour,
 * capped at 300 total points so long ranges stay lightweight.
 */
export function rangeToWindow(range: string): string {
  const match = range.match(/^(\d+)(s|m|h|d|w)$/i);
  if (!match) return "6m";

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const toHours: Record<string, number> = {
    s: 1 / 3600,
    m: 1 / 60,
    h: 1,
    d: 24,
    w: 168,
  };
  const totalHours = (toHours[unit] ?? 1) * value;

  // 10 points per hour, max 300
  const targetPoints = Math.min(Math.round(totalHours * 10), 300);
  const windowMinutes = Math.max(
    Math.round((totalHours * 60) / targetPoints),
    1,
  );

  if (windowMinutes < 60) return `${windowMinutes}m`;
  return `${Math.round(windowMinutes / 60)}h`;
}

export function validateRange(range: string, defaultRange = "24h"): string {
  if (typeof range === "string" && /^[0-9]+(s|m|h|d|w)$/i.test(range)) {
    return range;
  }
  return defaultRange;
}
