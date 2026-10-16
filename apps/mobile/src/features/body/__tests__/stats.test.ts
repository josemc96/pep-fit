import type { BodyMeasurement } from "@pep-fit/shared-types";
import { describe, expect, it } from "vitest";

import { addDaysToKey } from "../../../lib/dates";
import { latestValues, weightChanges, weightSeries } from "../stats";

const entry = (
  measuredOn: string,
  values: Partial<BodyMeasurement>,
): BodyMeasurement => ({
  measuredOn,
  weightKg: null,
  bodyFatPct: null,
  waistCm: null,
  hipsCm: null,
  chestCm: null,
  armCm: null,
  thighCm: null,
  ...values,
});

// As the API returns them: newest first.
const entries = [
  entry("2026-10-15", { waistCm: 83 }),
  entry("2026-10-08", { weightKg: 79.2, waistCm: 84 }),
  entry("2026-10-01", { weightKg: 80, armCm: 36 }),
  entry("2026-09-24", { weightKg: 81.5 }),
];

describe("weightSeries / weightChanges", () => {
  it("keeps weighed days only, oldest first", () => {
    expect(weightSeries(entries).map((p) => p.day)).toEqual([
      "2026-09-24",
      "2026-10-01",
      "2026-10-08",
    ]);
  });

  it("computes the change since the start and since the previous weigh-in", () => {
    const changes = weightChanges(weightSeries(entries))!;
    expect(changes.latest).toBe(79.2);
    expect(changes.sinceStart).toBeCloseTo(-2.3);
    expect(changes.sincePrevious).toBeCloseTo(-0.8);
  });

  it("handles no or a single weigh-in", () => {
    expect(weightChanges([])).toBeNull();
    expect(weightChanges([{ day: "2026-10-01", weightKg: 80 }])).toEqual({
      latest: 80,
      sinceStart: 0,
      sincePrevious: null,
    });
  });
});

describe("latestValues", () => {
  it("takes each metric from the newest entry that has it", () => {
    expect(latestValues(entries)).toEqual({
      weightKg: { value: 79.2, day: "2026-10-08" },
      waistCm: { value: 83, day: "2026-10-15" },
      armCm: { value: 36, day: "2026-10-01" },
    });
  });
});

describe("addDaysToKey", () => {
  it("moves across month boundaries", () => {
    expect(addDaysToKey("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
  });
});
