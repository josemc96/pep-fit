/**
 * Calendar maths on local dates. Weeks and months are judged in the user's
 * time zone (a 00:30 Monday workout in Madrid is Monday, even though it's
 * still Sunday in UTC), so instants are first turned into local day keys.
 */

/** A local calendar date, "YYYY-MM-DD". Sorts chronologically as a string. */
export type DayKey = string;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    // en-CA formats dates as YYYY-MM-DD.
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function localDayKey(date: Date, timeZone: string): DayKey {
  return formatterFor(timeZone).format(date);
}

function toUtcMs(day: DayKey): number {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year!, month! - 1, date!);
}

export function addDays(day: DayKey, days: number): DayKey {
  return new Date(toUtcMs(day) + days * 86_400_000).toISOString().slice(0, 10);
}

/** The Monday of the week containing `day`. */
export function weekStartOf(day: DayKey): DayKey {
  const weekday = new Date(toUtcMs(day)).getUTCDay(); // 0 = Sunday
  return addDays(day, -((weekday + 6) % 7));
}

/** "YYYY-MM". */
export function monthOf(day: DayKey): string {
  return day.slice(0, 7);
}
