import { describe, expect, it } from "vitest";

import {
  PreviousSetsQuerySchema,
  WorkoutInputSchema,
  nextRoutineDayIndex,
  workoutVolumeKg,
} from "../workout.js";

const validWorkout = {
  routineId: "8f14e45f-ceea-467e-a01b-c1b4d1a9c123",
  routineDayIndex: 1,
  startedAt: "2026-10-13T18:00:00.000Z",
  finishedAt: "2026-10-13T19:05:00.000Z",
  exercises: [
    {
      exerciseId: "9f14e45f-ceea-467e-a01b-c1b4d1a9c124",
      sets: [
        { reps: 8, weightKg: 60 },
        { reps: 12, weightKg: null },
      ],
    },
  ],
};

describe("WorkoutInputSchema", () => {
  it("parses a valid workout and coerces dates", () => {
    const parsed = WorkoutInputSchema.parse(validWorkout);
    expect(parsed.startedAt).toBeInstanceOf(Date);
    expect(parsed.exercises[0]!.sets[1]!.weightKg).toBeNull();
  });

  it("rejects a workout that ends before it starts", () => {
    expect(() =>
      WorkoutInputSchema.parse({
        ...validWorkout,
        finishedAt: "2026-10-13T17:00:00.000Z",
      }),
    ).toThrow();
  });

  it("rejects absurdly long workouts", () => {
    expect(() =>
      WorkoutInputSchema.parse({
        ...validWorkout,
        finishedAt: "2026-10-14T19:05:00.000Z",
      }),
    ).toThrow();
  });

  it("requires at least one exercise with at least one set of 1+ reps", () => {
    expect(() =>
      WorkoutInputSchema.parse({ ...validWorkout, exercises: [] }),
    ).toThrow();
    expect(() =>
      WorkoutInputSchema.parse({
        ...validWorkout,
        exercises: [
          { ...validWorkout.exercises[0], sets: [{ reps: 0, weightKg: 10 }] },
        ],
      }),
    ).toThrow();
  });
});

describe("nextRoutineDayIndex", () => {
  it("starts at the first day when never trained", () => {
    expect(nextRoutineDayIndex(null, 3)).toBe(0);
  });

  it("advances and wraps around", () => {
    expect(nextRoutineDayIndex(0, 3)).toBe(1);
    expect(nextRoutineDayIndex(2, 3)).toBe(0);
  });

  it("copes with a routine that lost days since", () => {
    expect(nextRoutineDayIndex(5, 3)).toBe(0);
  });
});

describe("workoutVolumeKg", () => {
  it("sums reps × kg and counts bodyweight sets as zero", () => {
    expect(
      workoutVolumeKg([
        { reps: 8, weightKg: 60 },
        { reps: 10, weightKg: 52.5 },
        { reps: 15, weightKg: null },
      ]),
    ).toBe(8 * 60 + 10 * 52.5);
  });
});

describe("PreviousSetsQuerySchema", () => {
  it("splits a comma-separated list of ids", () => {
    const ids = [
      "8f14e45f-ceea-467e-a01b-c1b4d1a9c123",
      "9f14e45f-ceea-467e-a01b-c1b4d1a9c124",
    ];
    expect(
      PreviousSetsQuerySchema.parse({ exerciseIds: ids.join(",") }).exerciseIds,
    ).toEqual(ids);
  });

  it("rejects an empty or malformed list", () => {
    expect(() => PreviousSetsQuerySchema.parse({ exerciseIds: "" })).toThrow();
    expect(() =>
      PreviousSetsQuerySchema.parse({ exerciseIds: "not-a-uuid" }),
    ).toThrow();
  });
});
