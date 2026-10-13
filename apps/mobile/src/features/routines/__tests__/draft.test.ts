import { RoutineInputSchema } from "@pep-fit/shared-types";
import { beforeEach, describe, expect, it } from "vitest";

import { draftToInput, emptyDraft, move, type DraftExercise } from "../draft";
import { useRoutineDraftStore } from "../useRoutineDraftStore";

const benchPress: DraftExercise["exercise"] = {
  id: "8f14e45f-ceea-467e-a01b-c1b4d1a9c123",
  name: "Press de banca",
  imageUrls: [],
  primaryMuscle: "chest",
  equipment: "barbell",
};
const squat: DraftExercise["exercise"] = {
  ...benchPress,
  id: "9f14e45f-ceea-467e-a01b-c1b4d1a9c124",
  name: "Sentadilla",
};

const store = () => useRoutineDraftStore.getState();
const firstDay = () => store().draft.days[0]!;

describe("move", () => {
  it("swaps with the neighbour and ignores moves past the edges", () => {
    expect(move(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(move(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
    expect(move(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(move(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });
});

describe("routine draft store", () => {
  beforeEach(() => store().reset(emptyDraft("Día 1")));

  it("builds a routine that passes API validation", () => {
    store().setName("Torso / Pierna");
    store().addExercises(firstDay().key, [benchPress, squat]);
    const benchKey = firstDay().exercises[0]!.key;
    store().updateSet(firstDay().key, benchKey, 0, { reps: 8, weightKg: 60.5 });

    const input = draftToInput(store().draft);
    expect(RoutineInputSchema.safeParse(input).success).toBe(true);
    expect(input.days[0]!.exercises.map((e) => e.exerciseId)).toEqual([
      benchPress.id,
      squat.id,
    ]);
    expect(input.days[0]!.exercises[0]!.sets[0]).toEqual({
      targetReps: 8,
      targetWeightKg: 60.5,
    });
  });

  it("pre-fills a new set from the previous one", () => {
    store().addExercises(firstDay().key, [benchPress]);
    const key = firstDay().exercises[0]!.key;
    store().updateSet(firstDay().key, key, 0, { reps: 10, weightKg: 40 });
    store().addSet(firstDay().key, key);

    expect(
      firstDay().exercises[0]!.sets.map(({ reps, weightKg }) => ({
        reps,
        weightKg,
      })),
    ).toEqual([
      { reps: 10, weightKg: 40 },
      { reps: 10, weightKg: 40 },
    ]);
  });

  it("reorders and removes days and exercises by key", () => {
    store().addDay("Día 2");
    const [day1, day2] = store().draft.days;
    store().moveDay(day2!.key, -1);
    expect(store().draft.days.map((d) => d.name)).toEqual(["Día 2", "Día 1"]);
    store().removeDay(day1!.key);
    expect(store().draft.days.map((d) => d.name)).toEqual(["Día 2"]);

    store().addExercises(firstDay().key, [benchPress, squat]);
    const [bench] = firstDay().exercises;
    store().moveExercise(firstDay().key, bench!.key, 1);
    expect(firstDay().exercises.map((e) => e.exercise.name)).toEqual([
      "Sentadilla",
      "Press de banca",
    ]);
    store().removeExercise(firstDay().key, bench!.key);
    expect(firstDay().exercises.map((e) => e.exercise.name)).toEqual([
      "Sentadilla",
    ]);
  });

  it("falls back to the default rest time when left empty", () => {
    store().setName("X");
    store().addExercises(firstDay().key, [benchPress]);
    store().setRestSeconds(firstDay().key, firstDay().exercises[0]!.key, null);
    expect(draftToInput(store().draft).days[0]!.exercises[0]!.restSeconds).toBe(
      90,
    );
  });

  it("fails validation without a name", () => {
    expect(
      RoutineInputSchema.safeParse(draftToInput(store().draft)).success,
    ).toBe(false);
  });
});
