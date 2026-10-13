import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  newSetAfter,
  type ActiveExercise,
  type ActiveSet,
  type ActiveWorkout,
} from "./activeWorkout";

export const REST_TIME_STEP_SECONDS = 15;

type RestTimer = { endsAt: number; totalSeconds: number };

interface ActiveWorkoutState {
  workout: ActiveWorkout | null;
  restTimer: RestTimer | null;

  start: (workout: ActiveWorkout) => void;
  /** Ends the workout on the device (after saving it, or to discard it). */
  clear: () => void;

  updateSet: (
    exerciseKey: string,
    index: number,
    patch: Partial<Pick<ActiveSet, "reps" | "weightKg">>,
  ) => void;
  /** Completing a set also starts that exercise's rest timer. */
  toggleSetCompleted: (exerciseKey: string, index: number) => void;
  addSet: (exerciseKey: string) => void;
  removeSet: (exerciseKey: string, index: number) => void;

  addRestTime: () => void;
  skipRest: () => void;
}

/**
 * Persisted to device storage so an in-progress workout survives the app
 * being closed, and works with no signal in the gym.
 */
export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set, get) => {
      const updateExercise = (
        exerciseKey: string,
        fn: (exercise: ActiveExercise) => ActiveExercise,
      ) =>
        set((state) =>
          state.workout
            ? {
                workout: {
                  ...state.workout,
                  exercises: state.workout.exercises.map((exercise) =>
                    exercise.key === exerciseKey ? fn(exercise) : exercise,
                  ),
                },
              }
            : state,
        );

      return {
        workout: null,
        restTimer: null,

        start: (workout) => set({ workout, restTimer: null }),
        clear: () => set({ workout: null, restTimer: null }),

        updateSet: (exerciseKey, index, patch) =>
          updateExercise(exerciseKey, (exercise) => ({
            ...exercise,
            sets: exercise.sets.map((s, i) =>
              i === index ? { ...s, ...patch } : s,
            ),
          })),

        toggleSetCompleted: (exerciseKey, index) => {
          const exercise = get().workout?.exercises.find(
            (e) => e.key === exerciseKey,
          );
          const target = exercise?.sets[index];
          if (!exercise || !target) return;
          if (!target.completed && target.reps === null) return;

          updateExercise(exerciseKey, (e) => ({
            ...e,
            sets: e.sets.map((s, i) =>
              i === index ? { ...s, completed: !s.completed } : s,
            ),
          }));

          if (!target.completed && exercise.restSeconds > 0) {
            set({
              restTimer: {
                endsAt: Date.now() + exercise.restSeconds * 1000,
                totalSeconds: exercise.restSeconds,
              },
            });
          }
        },

        addSet: (exerciseKey) =>
          updateExercise(exerciseKey, (exercise) => ({
            ...exercise,
            sets: [...exercise.sets, newSetAfter(exercise.sets)],
          })),

        removeSet: (exerciseKey, index) =>
          updateExercise(exerciseKey, (exercise) => ({
            ...exercise,
            sets: exercise.sets.filter((_, i) => i !== index),
          })),

        addRestTime: () =>
          set(({ restTimer }) =>
            restTimer
              ? {
                  restTimer: {
                    // Extending a finished rest restarts from now.
                    endsAt:
                      Math.max(restTimer.endsAt, Date.now()) +
                      REST_TIME_STEP_SECONDS * 1000,
                    totalSeconds:
                      restTimer.totalSeconds + REST_TIME_STEP_SECONDS,
                  },
                }
              : {},
          ),
        skipRest: () => set({ restTimer: null }),
      };
    },
    {
      name: "pep-fit-active-workout",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/**
 * False until the persisted workout has been read back from device storage,
 * so screens don't flash "no workout" for a moment on app start.
 */
export function useActiveWorkoutHydrated() {
  return useSyncExternalStore(
    (onChange) => useActiveWorkoutStore.persist.onFinishHydration(onChange),
    () => useActiveWorkoutStore.persist.hasHydrated(),
  );
}
