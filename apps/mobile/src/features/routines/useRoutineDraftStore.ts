import { create } from "zustand";

import {
  move,
  newExercise,
  newSetAfter,
  nextKey,
  type DraftDay,
  type DraftExercise,
  type DraftSet,
  type RoutineDraft,
} from "./draft";

/**
 * The routine being edited. Lives in a store (not component state) so the
 * exercise picker screen can add exercises to it directly.
 */
interface RoutineDraftState {
  draft: RoutineDraft;
  reset: (draft: RoutineDraft) => void;
  setName: (name: string) => void;

  addDay: (name: string) => void;
  renameDay: (dayKey: string, name: string) => void;
  removeDay: (dayKey: string) => void;
  moveDay: (dayKey: string, offset: -1 | 1) => void;

  addExercises: (
    dayKey: string,
    exercises: DraftExercise["exercise"][],
  ) => void;
  removeExercise: (dayKey: string, exerciseKey: string) => void;
  moveExercise: (dayKey: string, exerciseKey: string, offset: -1 | 1) => void;
  setRestSeconds: (
    dayKey: string,
    exerciseKey: string,
    seconds: number | null,
  ) => void;

  addSet: (dayKey: string, exerciseKey: string) => void;
  updateSet: (
    dayKey: string,
    exerciseKey: string,
    index: number,
    patch: Partial<Omit<DraftSet, "key">>,
  ) => void;
  removeSet: (dayKey: string, exerciseKey: string, index: number) => void;
}

const indexOfKey = (items: { key: string }[], key: string) =>
  items.findIndex((item) => item.key === key);

export const useRoutineDraftStore = create<RoutineDraftState>((set) => {
  const updateDraft = (fn: (draft: RoutineDraft) => RoutineDraft) =>
    set((state) => ({ draft: fn(state.draft) }));

  const updateDay = (dayKey: string, fn: (day: DraftDay) => DraftDay) =>
    updateDraft((draft) => ({
      ...draft,
      days: draft.days.map((day) => (day.key === dayKey ? fn(day) : day)),
    }));

  const updateExercise = (
    dayKey: string,
    exerciseKey: string,
    fn: (exercise: DraftExercise) => DraftExercise,
  ) =>
    updateDay(dayKey, (day) => ({
      ...day,
      exercises: day.exercises.map((exercise) =>
        exercise.key === exerciseKey ? fn(exercise) : exercise,
      ),
    }));

  return {
    draft: { name: "", days: [] },
    reset: (draft) => set({ draft }),
    setName: (name) => updateDraft((draft) => ({ ...draft, name })),

    addDay: (name) =>
      updateDraft((draft) => ({
        ...draft,
        days: [...draft.days, { key: nextKey(), name, exercises: [] }],
      })),
    renameDay: (dayKey, name) => updateDay(dayKey, (day) => ({ ...day, name })),
    removeDay: (dayKey) =>
      updateDraft((draft) => ({
        ...draft,
        days: draft.days.filter((day) => day.key !== dayKey),
      })),
    moveDay: (dayKey, offset) =>
      updateDraft((draft) => ({
        ...draft,
        days: move(draft.days, indexOfKey(draft.days, dayKey), offset),
      })),

    addExercises: (dayKey, exercises) =>
      updateDay(dayKey, (day) => ({
        ...day,
        exercises: [...day.exercises, ...exercises.map(newExercise)],
      })),
    removeExercise: (dayKey, exerciseKey) =>
      updateDay(dayKey, (day) => ({
        ...day,
        exercises: day.exercises.filter((e) => e.key !== exerciseKey),
      })),
    moveExercise: (dayKey, exerciseKey, offset) =>
      updateDay(dayKey, (day) => ({
        ...day,
        exercises: move(
          day.exercises,
          indexOfKey(day.exercises, exerciseKey),
          offset,
        ),
      })),
    setRestSeconds: (dayKey, exerciseKey, restSeconds) =>
      updateExercise(dayKey, exerciseKey, (exercise) => ({
        ...exercise,
        restSeconds,
      })),

    addSet: (dayKey, exerciseKey) =>
      updateExercise(dayKey, exerciseKey, (exercise) => ({
        ...exercise,
        sets: [...exercise.sets, newSetAfter(exercise.sets)],
      })),
    updateSet: (dayKey, exerciseKey, index, patch) =>
      updateExercise(dayKey, exerciseKey, (exercise) => ({
        ...exercise,
        sets: exercise.sets.map((s, i) =>
          i === index ? { ...s, ...patch } : s,
        ),
      })),
    removeSet: (dayKey, exerciseKey, index) =>
      updateExercise(dayKey, exerciseKey, (exercise) => ({
        ...exercise,
        sets: exercise.sets.filter((_, i) => i !== index),
      })),
  };
});
