import type { Locale, WorkoutSet } from "@pep-fit/shared-types";

/** e.g. "mar, 14 oct 2026" (es) / "Tue, Oct 14, 2026" (en). */
export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** e.g. "18:05". */
export function formatTime(date: Date, locale: Locale): string {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** e.g. "52,5" (es) / "52.5" (en); no trailing zeros. */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    value,
  );
}

/** e.g. "45 min", "1 h 05 min". */
export function formatDuration(start: Date, end: Date): string {
  const minutes = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60_000),
  );
  const hours = Math.floor(minutes / 60);
  return hours > 0
    ? `${hours} h ${String(minutes % 60).padStart(2, "0")} min`
    : `${minutes} min`;
}

/** e.g. "60 kg × 8", or "× 12" for a bodyweight set. */
export function formatSet(set: WorkoutSet, locale: Locale): string {
  return set.weightKg === null
    ? `× ${set.reps}`
    : `${formatNumber(set.weightKg, locale)} kg × ${set.reps}`;
}

/** A "YYYY-MM-DD" key as a local date (not UTC midnight). */
function fromDayKey(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year!, month! - 1, date!);
}

/** e.g. "12 oct" / "Oct 12". Accepts a "YYYY-MM-DD" key or a Date. */
export function formatDayMonth(day: string | Date, locale: Locale): string {
  const date = typeof day === "string" ? fromDayKey(day) : day;
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

/** "2026-10" → "octubre de 2026" / "October 2026". */
export function formatMonth(month: string, locale: Locale): string {
  return fromDayKey(`${month}-01`).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}
