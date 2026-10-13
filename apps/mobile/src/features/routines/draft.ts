import {
  DEFAULT_REST_SECONDS,
  ROUTINE_LIMITS,
  type Exercise,
  type Routine,
  type RoutineInput,
} from "@pep-fit/shared-types";

/**
 * Client-side editable copy of a routine. Every node carries a `key` so React
 * lists stay stable while items are added, removed and reordered.
 */
export type DraftSet = {
  key: string;
  reps: number | null;
  weightKg: number | null;
};

export type DraftExercise = {
  key: string;
  exercise: Pick<
    Exercise,
    "id" | "name" | "imageUrls" | "primaryMuscle" | "equipment"
  >;
  restSeconds: number | null;
  sets: DraftSet[];
};

export type DraftDay = {
  key: string;
  name: string;
  exercises: DraftExercise[];
};

export type RoutineDraft = {
  name: string;
  days: DraftDay[];
};

let keySequence = 0;
export const nextKey = () => `k${++keySequence}`;

export function emptyDraft(firstDayName: string): RoutineDraft {
  return {
    name: "",
    days: [{ key: nextKey(), name: firstDayName, exercises: [] }],
  };
}

export function draftFromRoutine(routine: Routine): RoutineDraft {
  return {
    name: routine.name,
    days: routine.days.map((day) => ({
      key: nextKey(),
      name: day.name,
      exercises: day.exercises.map((routineExercise) => ({
        key: nextKey(),
        exercise: routineExercise.exercise,
        restSeconds: routineExercise.restSeconds,
        sets: routineExercise.sets.map((set) => ({
          key: nextKey(),
          reps: set.targetReps,
          weightKg: set.targetWeightKg,
        })),
      })),
    })),
  };
}

/** Request body for the API. Validate it with `RoutineInputSchema` first. */
export function draftToInput(draft: RoutineDraft): RoutineInput {
  return {
    name: draft.name,
    days: draft.days.map((day) => ({
      name: day.name,
      exercises: day.exercises.map((draftExercise) => ({
        exerciseId: draftExercise.exercise.id,
        restSeconds: draftExercise.restSeconds ?? DEFAULT_REST_SECONDS,
        sets: draftExercise.sets.map((set) => ({
          targetReps: set.reps,
          targetWeightKg: set.weightKg,
        })),
      })),
    })),
  };
}

/** Returns a copy of `items` with the item at `index` moved by `offset`. */
export function move<T>(items: T[], index: number, offset: -1 | 1): T[] {
  const target = index + offset;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

export function newExercise(
  exercise: DraftExercise["exercise"],
): DraftExercise {
  return {
    key: nextKey(),
    exercise,
    restSeconds: DEFAULT_REST_SECONDS,
    sets: [{ key: nextKey(), reps: null, weightKg: null }],
  };
}

/** New set pre-filled from the last one, which is what you usually want. */
export function newSetAfter(sets: DraftSet[]): DraftSet {
  const last = sets.at(-1);
  return {
    key: nextKey(),
    reps: last?.reps ?? null,
    weightKg: last?.weightKg ?? null,
  };
}

export const canAddDay = (draft: RoutineDraft) =>
  draft.days.length < ROUTINE_LIMITS.maxDays;
