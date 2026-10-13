import type { Exercise, Routine, WorkoutInput } from "@pep-fit/shared-types";

import { nextKey } from "../../lib/keys";

export type ActiveSet = {
  key: string;
  reps: number | null;
  weightKg: number | null;
  completed: boolean;
};

export type ActiveExercise = {
  key: string;
  exercise: Pick<
    Exercise,
    "id" | "name" | "imageUrls" | "primaryMuscle" | "equipment"
  >;
  restSeconds: number;
  sets: ActiveSet[];
};

/** The workout in progress. Lives on the device until it's finished. */
export type ActiveWorkout = {
  routineId: string | null;
  routineName: string | null;
  dayIndex: number | null;
  dayName: string | null;
  /** ISO timestamp (JSON-persistable). */
  startedAt: string;
  exercises: ActiveExercise[];
};

/** Starts a workout from a routine day, pre-filled with its target sets. */
export function workoutFromRoutineDay(
  routine: Routine,
  dayIndex: number,
  now: Date = new Date(),
): ActiveWorkout {
  const day = routine.days[dayIndex];
  if (!day) {
    throw new Error(`Routine has no day at index ${dayIndex}`);
  }

  return {
    routineId: routine.id,
    routineName: routine.name,
    dayIndex,
    dayName: day.name,
    startedAt: now.toISOString(),
    exercises: day.exercises.map((routineExercise) => ({
      key: nextKey(),
      exercise: routineExercise.exercise,
      restSeconds: routineExercise.restSeconds,
      sets: routineExercise.sets.map((set) => ({
        key: nextKey(),
        reps: set.targetReps,
        weightKg: set.targetWeightKg,
        completed: false,
      })),
    })),
  };
}

const isLoggable = (set: ActiveSet): set is ActiveSet & { reps: number } =>
  set.completed && set.reps !== null && set.reps > 0;

export function countSets(workout: ActiveWorkout) {
  const sets = workout.exercises.flatMap((exercise) => exercise.sets);
  return {
    total: sets.length,
    completed: sets.filter(isLoggable).length,
  };
}

/**
 * API payload with only the completed sets (exercises with none are left
 * out). Null when nothing was completed, i.e. there is nothing to save.
 */
export function workoutToInput(
  workout: ActiveWorkout,
  finishedAt: Date = new Date(),
): WorkoutInput | null {
  const exercises = workout.exercises
    .map((exercise) => ({
      exerciseId: exercise.exercise.id,
      sets: exercise.sets.filter(isLoggable).map((set) => ({
        reps: set.reps,
        weightKg: set.weightKg,
      })),
    }))
    .filter((exercise) => exercise.sets.length > 0);

  if (exercises.length === 0) return null;

  return {
    routineId: workout.routineId,
    routineDayIndex: workout.dayIndex,
    startedAt: workout.startedAt,
    finishedAt: finishedAt.toISOString(),
    exercises,
  };
}

/** New set pre-filled from the last one; never pre-completed. */
export function newSetAfter(sets: ActiveSet[]): ActiveSet {
  const last = sets.at(-1);
  return {
    key: nextKey(),
    reps: last?.reps ?? null,
    weightKg: last?.weightKg ?? null,
    completed: false,
  };
}
