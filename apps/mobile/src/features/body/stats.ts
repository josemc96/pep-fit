import {
  BODY_METRIC_KEYS,
  type BodyMeasurement,
  type BodyMetric,
} from "@pep-fit/shared-types";

export type WeightPoint = { day: string; weightKg: number };

/** Weight entries, oldest first (for the chart). */
export function weightSeries(entries: BodyMeasurement[]): WeightPoint[] {
  return entries
    .filter((entry) => entry.weightKg !== null)
    .map((entry) => ({ day: entry.measuredOn, weightKg: entry.weightKg! }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/** Change from the first and from the previous weigh-in to the latest. */
export function weightChanges(series: WeightPoint[]) {
  const latest = series.at(-1);
  if (!latest) return null;
  return {
    latest: latest.weightKg,
    sinceStart: latest.weightKg - series[0]!.weightKg,
    sincePrevious:
      series.length > 1 ? latest.weightKg - series.at(-2)!.weightKg : null,
  };
}

/** The most recent value logged for each metric (any entry may skip some). */
export function latestValues(
  entries: BodyMeasurement[],
): Partial<Record<BodyMetric, { value: number; day: string }>> {
  const latest: Partial<Record<BodyMetric, { value: number; day: string }>> =
    {};
  const newestFirst = [...entries].sort((a, b) =>
    b.measuredOn.localeCompare(a.measuredOn),
  );
  for (const key of BODY_METRIC_KEYS) {
    const entry = newestFirst.find((e) => e[key] !== null);
    if (entry) latest[key] = { value: entry[key]!, day: entry.measuredOn };
  }
  return latest;
}
