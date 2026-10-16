/** Local calendar dates as "YYYY-MM-DD" keys (what the API uses for days). */

export function toDayKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function todayKey(): string {
  return toDayKey(new Date());
}

export function addDaysToKey(day: string, days: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return toDayKey(new Date(year!, month! - 1, date! + days));
}
