import { describe, expect, it } from "vitest";

import { BodyMeasurementInputSchema, DayKeySchema } from "../body.js";

const empty = {
  weightKg: null,
  bodyFatPct: null,
  waistCm: null,
  hipsCm: null,
  chestCm: null,
  armCm: null,
  thighCm: null,
};

describe("BodyMeasurementInputSchema", () => {
  it("accepts any subset of metrics", () => {
    expect(
      BodyMeasurementInputSchema.parse({ ...empty, weightKg: 78.4 }).weightKg,
    ).toBe(78.4);
    expect(
      BodyMeasurementInputSchema.parse({ ...empty, waistCm: 82 }).waistCm,
    ).toBe(82);
  });

  it("requires at least one value", () => {
    expect(() => BodyMeasurementInputSchema.parse(empty)).toThrow();
  });

  it("rejects out-of-range values (typos)", () => {
    expect(() =>
      BodyMeasurementInputSchema.parse({ ...empty, weightKg: 800 }),
    ).toThrow();
    expect(() =>
      BodyMeasurementInputSchema.parse({ ...empty, bodyFatPct: 0 }),
    ).toThrow();
  });
});

describe("DayKeySchema", () => {
  it("accepts real dates only", () => {
    expect(DayKeySchema.parse("2026-10-15")).toBe("2026-10-15");
    expect(() => DayKeySchema.parse("2026-13-01")).toThrow();
    expect(() => DayKeySchema.parse("15/10/2026")).toThrow();
  });
});
