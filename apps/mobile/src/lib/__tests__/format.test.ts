import { describe, expect, it } from "vitest";

import {
  formatDayMonth,
  formatDuration,
  formatMonth,
  formatNumber,
  formatSet,
} from "../format";

describe("formatDuration", () => {
  const at = (minutes: number) => new Date(Date.UTC(2026, 9, 14, 18, minutes));

  it("shows minutes under an hour and pads minutes over it", () => {
    expect(formatDuration(at(0), at(45))).toBe("45 min");
    expect(formatDuration(at(0), at(65))).toBe("1 h 05 min");
  });
});

describe("formatNumber / formatSet", () => {
  it("uses the locale's decimal separator", () => {
    expect(formatNumber(52.5, "es")).toBe("52,5");
    expect(formatNumber(52.5, "en")).toBe("52.5");
    expect(formatNumber(60, "es")).toBe("60");
  });

  it("formats weighted and bodyweight sets", () => {
    expect(formatSet({ reps: 8, weightKg: 62.5 }, "es")).toBe("62,5 kg × 8");
    expect(formatSet({ reps: 12, weightKg: null }, "en")).toBe("× 12");
  });
});

describe("formatDayMonth / formatMonth", () => {
  it("reads day keys as local dates", () => {
    expect(formatDayMonth("2026-10-12", "en")).toBe("Oct 12");
    expect(formatMonth("2026-10", "en")).toBe("October 2026");
  });
});
