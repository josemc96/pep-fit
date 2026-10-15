import { WorkoutInputSchema, type Routine } from "@pep-fit/shared-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The store persists through AsyncStorage, which needs React Native.
vi.mock("@react-native-async-storage/async-storage", () => {
  const data = new Map<string, string>();
  return {
    default: {
      getItem: async (key: string) => data.get(key) ?? null,
      setItem: async (key: string, value: string) => void data.set(key, value),
      removeItem: async (key: string) => void data.delete(key),
    },
  };
});

const { countSets, workoutFromRoutineDay, workoutToInput } =
  await import("../activeWorkout");
const { REST_TIME_STEP_SECONDS, useActiveWorkoutStore } =
  await import("../useActiveWorkoutStore");

const exercise = (id: string, name: string) => ({
  id,
  name,
  primaryMuscle: "chest" as const,
  secondaryMuscles: [],
  equipment: "barbell" as const,
  category: "strength" as const,
  imageUrls: [],
});

const routine: Routine = {
  id: "8f14e45f-ceea-467e-a01b-c1b4d1a9c123",
  name: "Torso / Pierna",
  isActive: true,
  sourceTemplateId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  days: [
    {
      id: "d0000000-0000-4000-8000-000000000000",
      name: "Torso",
      exercises: [],
    },
    {
      id: "d1000000-0000-4000-8000-000000000000",
      name: "Pierna",
      exercises: [
        {
          id: "e0000000-0000-4000-8000-000000000000",
          exerciseId: "9f14e45f-ceea-467e-a01b-c1b4d1a9c124",
          exercise: exercise(
            "9f14e45f-ceea-467e-a01b-c1b4d1a9c124",
            "Sentadilla",
          ),
          restSeconds: 120,
          sets: [
            {
              id: "50000000-0000-4000-8000-000000000000",
              targetReps: 5,
              targetWeightKg: 100,
            },
            {
              id: "51000000-0000-4000-8000-000000000000",
              targetReps: null,
              targetWeightKg: null,
            },
          ],
        },
        {
          id: "e1000000-0000-4000-8000-000000000000",
          exerciseId: "af14e45f-ceea-467e-a01b-c1b4d1a9c125",
          exercise: exercise(
            "af14e45f-ceea-467e-a01b-c1b4d1a9c125",
            "Zancadas",
          ),
          restSeconds: 0,
          sets: [
            {
              id: "52000000-0000-4000-8000-000000000000",
              targetReps: 12,
              targetWeightKg: null,
            },
          ],
        },
      ],
    },
  ],
};

const store = () => useActiveWorkoutStore.getState();
const squat = () => store().workout!.exercises[0]!;
const lunges = () => store().workout!.exercises[1]!;

describe("workoutFromRoutineDay", () => {
  it("snapshots the day and pre-fills target sets, none completed", () => {
    const workout = workoutFromRoutineDay(
      routine,
      1,
      new Date("2026-10-13T18:00:00Z"),
    );
    expect(workout).toMatchObject({
      routineId: routine.id,
      routineName: "Torso / Pierna",
      dayIndex: 1,
      dayName: "Pierna",
      startedAt: "2026-10-13T18:00:00.000Z",
    });
    expect(workout.exercises[0]!.sets).toMatchObject([
      { reps: 5, weightKg: 100, completed: false },
      { reps: null, weightKg: null, completed: false },
    ]);
  });
});

describe("active workout store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T18:00:00Z"));
    store().start(workoutFromRoutineDay(routine, 1));
  });
  afterEach(() => vi.useRealTimers());

  it("starts the exercise's rest timer when a set is completed", () => {
    store().toggleSetCompleted(squat().key, 0);
    expect(squat().sets[0]!.completed).toBe(true);
    expect(store().restTimer).toEqual({
      endsAt: Date.now() + 120_000,
      totalSeconds: 120,
    });

    store().addRestTime();
    expect(store().restTimer!.totalSeconds).toBe(120 + REST_TIME_STEP_SECONDS);
    store().skipRest();
    expect(store().restTimer).toBeNull();
  });

  it("doesn't start a timer for exercises without rest", () => {
    store().toggleSetCompleted(lunges().key, 0);
    expect(store().restTimer).toBeNull();
  });

  it("won't complete a set without reps", () => {
    store().toggleSetCompleted(squat().key, 1);
    expect(squat().sets[1]!.completed).toBe(false);

    store().updateSet(squat().key, 1, { reps: 3 });
    store().toggleSetCompleted(squat().key, 1);
    expect(squat().sets[1]!.completed).toBe(true);
  });

  it("only sends completed sets and drops exercises without any", () => {
    expect(workoutToInput(store().workout!)).toBeNull();

    store().toggleSetCompleted(squat().key, 0);
    store().addSet(squat().key);
    expect(squat().sets[2]).toMatchObject({ reps: null, completed: false });
    expect(countSets(store().workout!)).toEqual({ total: 4, completed: 1 });

    const input = workoutToInput(
      store().workout!,
      new Date("2026-10-13T19:00:00Z"),
    );
    expect(WorkoutInputSchema.safeParse(input).success).toBe(true);
    expect(input).toMatchObject({
      routineId: routine.id,
      routineDayIndex: 1,
      exercises: [
        {
          exerciseId: routine.days[1]!.exercises[0]!.exerciseId,
          sets: [{ reps: 5, weightKg: 100 }],
        },
      ],
    });
  });

  it("clears the workout and timer", () => {
    store().toggleSetCompleted(squat().key, 0);
    store().clear();
    expect(store().workout).toBeNull();
    expect(store().restTimer).toBeNull();
  });
});
