import { describe, expect, it } from "vitest";

import { ROUTINE_LIMITS, RoutineInputSchema } from "../routine.js";

const exerciseId = "8f14e45f-ceea-467e-a01b-c1b4d1a9c123";

const validRoutine = {
  name: "Push / Pull / Legs",
  days: [
    {
      name: "Push",
      exercises: [
        {
          exerciseId,
          restSeconds: 90,
          sets: [
            { targetReps: 8, targetWeightKg: 60 },
            { targetReps: null, targetWeightKg: null },
          ],
        },
      ],
    },
  ],
};

describe("RoutineInputSchema", () => {
  it("parses a valid routine", () => {
    expect(RoutineInputSchema.parse(validRoutine)).toEqual(validRoutine);
  });

  it("trims names and rejects blank ones", () => {
    expect(
      RoutineInputSchema.parse({ ...validRoutine, name: "  PPL  " }).name,
    ).toBe("PPL");
    expect(() =>
      RoutineInputSchema.parse({ ...validRoutine, name: "   " }),
    ).toThrow();
  });

  it("requires at least one day", () => {
    expect(() =>
      RoutineInputSchema.parse({ ...validRoutine, days: [] }),
    ).toThrow();
  });

  it("caps the number of days", () => {
    const days = Array.from({ length: ROUTINE_LIMITS.maxDays + 1 }, () => ({
      name: "Day",
      exercises: [],
    }));
    expect(() => RoutineInputSchema.parse({ ...validRoutine, days })).toThrow();
  });

  it("requires at least one set per exercise", () => {
    const routine = structuredClone(validRoutine);
    routine.days[0]!.exercises[0]!.sets = [];
    expect(() => RoutineInputSchema.parse(routine)).toThrow();
  });

  it("rejects non-integer or zero reps", () => {
    for (const targetReps of [0, 7.5]) {
      const routine = structuredClone(validRoutine);
      routine.days[0]!.exercises[0]!.sets[0]!.targetReps = targetReps;
      expect(() => RoutineInputSchema.parse(routine)).toThrow();
    }
  });
});
