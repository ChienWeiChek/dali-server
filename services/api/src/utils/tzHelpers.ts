/**
 * Returns "YYYY-MM-DD" for a given UTC date interpreted in the target timezone.
 */
export function localDateStr(tz: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(date);
}

/**
 * Returns "YYYY-MM-DD" for today+offsetDays in the target timezone.
 * offset 0 = today, -1 = yesterday, -2 = day before yesterday, etc.
 */
export function localDayStr(tz: string, offset = 0): string {
  const base = localDateStr(tz);
  const [y, mo, d] = base.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, mo - 1, d + offset));
  return shifted.toISOString().slice(0, 10);
}

/**
 * Returns "YYYY-MM-01" for the first day of the current month + offsetMonths.
 * offset 0 = this month, -1 = last month, -2 = month before last, etc.
 */
export function localMonthStartStr(tz: string, offset = 0): string {
  const base = localDateStr(tz);
  const [y, mo] = base.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, mo - 1 + offset, 1));
  return shifted.toISOString().slice(0, 10);
}

/**
 * Returns the UTC Date that represents midnight (00:00:00) on the given local
 * date string ("YYYY-MM-DD") in the target timezone.
 *
 * Uses noon UTC as the reference point to determine the tz offset, which avoids
 * edge cases when DST transitions happen close to midnight.
 */
export function localMidnightUTC(tz: string, localDate: string): Date {
  const noonUTC = new Date(`${localDate}T12:00:00Z`);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(noonUTC);

  const h = parseInt(parts.find((p) => p.type === "hour")!.value);
  const m = parseInt(parts.find((p) => p.type === "minute")!.value);

  // At noon UTC the local clock shows h:m → offset vs UTC = (h*60+m) - 720 minutes
  const offsetMinutes = h * 60 + m - 720;

  const utcMidnight = new Date(`${localDate}T00:00:00Z`);
  return new Date(utcMidnight.getTime() - offsetMinutes * 60_000);
}
