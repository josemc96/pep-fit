import type { WorkoutSaved } from "@pep-fit/shared-types";
import { create } from "zustand";

/**
 * What the workout just saved earned, shown once on the dashboard until
 * dismissed. Not persisted: it's a moment, the history keeps the facts.
 */
interface LastWorkoutResultState {
  result: WorkoutSaved | null;
  show: (result: WorkoutSaved) => void;
  dismiss: () => void;
}

export const useLastWorkoutResultStore = create<LastWorkoutResultState>(
  (set) => ({
    result: null,
    show: (result) => set({ result }),
    dismiss: () => set({ result: null }),
  }),
);
