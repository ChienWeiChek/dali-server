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

/** Validates and returns a safe InfluxDB tag value (alphanumeric, colon, underscore, hyphen). */
export function validateTag(value: string, label: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9:_\-]+$/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

/** Returns the ISO 8601 week key ("YYYY-Www") for a UTC date. Weeks start on Monday. */
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // shift to Thursday (ISO anchor)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Returns a human-readable label for an ISO week key, e.g. "W23 Jun 1". */
export function isoWeekLabel(weekKey: string): string {
  const [yearStr, weekStr] = weekKey.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  // Jan 4 is always in ISO week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4.getTime() + (week - 1) * 7 * 86_400_000);
  const dayOfWeek = monday.getUTCDay() || 7;
  monday.setUTCDate(monday.getUTCDate() - dayOfWeek + 1); // rewind to Monday
  return `W${week} ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
}
