import {
  LatestWorkoutResponseSchema,
  WorkoutSummarySchema,
  type WorkoutInput,
} from "@pep-fit/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "../../../lib/useApi";

export const workoutKeys = {
  all: ["workouts"] as const,
  latest: (routineId: string | null) =>
    ["workouts", "latest", routineId] as const,
};

/** Most recent workout of a routine (null if never trained). */
export function useLatestWorkoutQuery(routineId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: workoutKeys.latest(routineId),
    enabled: routineId !== null,
    queryFn: async () => {
      const raw = await api<unknown>(`/workouts/latest?routineId=${routineId}`);
      return LatestWorkoutResponseSchema.parse(raw).workout;
    },
  });
}

export function useSaveWorkoutMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WorkoutInput) =>
      WorkoutSummarySchema.parse(
        await api<unknown>("/workouts", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: workoutKeys.all }),
  });
}
