import {
  LatestWorkoutResponseSchema,
  PreviousSetsResponseSchema,
  WorkoutDetailSchema,
  WorkoutPageSchema,
  WorkoutSummarySchema,
  type Locale,
  type WorkoutInput,
} from "@pep-fit/shared-types";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useApi } from "../../../lib/useApi";

export const workoutKeys = {
  all: ["workouts"] as const,
  latest: (routineId: string | null) =>
    ["workouts", "latest", routineId] as const,
  history: ["workouts", "history"] as const,
  detail: (id: string, lang: Locale) =>
    ["workouts", "detail", id, lang] as const,
  previousSets: (exerciseIds: string[]) =>
    ["workouts", "previous-sets", ...exerciseIds] as const,
};

const HISTORY_PAGE_SIZE = 20;

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

/** Workout history, newest first, loaded page by page. */
export function useWorkoutHistoryQuery() {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: workoutKeys.history,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      WorkoutPageSchema.parse(
        await api<unknown>(
          `/workouts?page=${pageParam}&pageSize=${HISTORY_PAGE_SIZE}`,
        ),
      ),
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
  });
}

export function useWorkoutQuery(id: string, lang: Locale) {
  const api = useApi();
  return useQuery({
    queryKey: workoutKeys.detail(id, lang),
    queryFn: async () =>
      WorkoutDetailSchema.parse(
        await api<unknown>(`/workouts/${id}?lang=${lang}`),
      ),
  });
}

export function useDeleteWorkoutMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/workouts/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: workoutKeys.all }),
  });
}

/**
 * What was done last time for each exercise, keyed by exercise id. Purely
 * informative: failures (e.g. no signal) just mean nothing is shown.
 */
export function usePreviousSetsQuery(exerciseIds: string[]) {
  const api = useApi();
  const ids = [...new Set(exerciseIds)].sort();

  return useQuery({
    queryKey: workoutKeys.previousSets(ids),
    enabled: ids.length > 0,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const raw = await api<unknown>(
        `/workouts/previous-sets?exerciseIds=${ids.join(",")}`,
      );
      const { items } = PreviousSetsResponseSchema.parse(raw);
      return new Map(items.map((item) => [item.exerciseId, item]));
    },
  });
}
