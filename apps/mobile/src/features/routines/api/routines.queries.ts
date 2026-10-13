import {
  RoutineSchema,
  RoutineSummarySchema,
  type Locale,
  type RoutineInput,
} from "@pep-fit/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "../../../lib/useApi";

export const routineKeys = {
  all: ["routines"] as const,
  detail: (id: string, lang: Locale) => ["routines", id, lang] as const,
};

export function useRoutinesQuery() {
  const api = useApi();
  return useQuery({
    queryKey: routineKeys.all,
    queryFn: async () =>
      RoutineSummarySchema.array().parse(await api<unknown>("/routines")),
  });
}

export function useRoutineQuery(id: string | null, lang: Locale) {
  const api = useApi();
  return useQuery({
    queryKey: routineKeys.detail(id ?? "", lang),
    enabled: id !== null,
    queryFn: async () =>
      RoutineSchema.parse(await api<unknown>(`/routines/${id}?lang=${lang}`)),
  });
}

/** Creates the routine when `id` is null, otherwise replaces it. */
export function useSaveRoutineMutation(lang: Locale) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string | null;
      input: RoutineInput;
    }) => {
      const raw = await api<unknown>(
        id ? `/routines/${id}?lang=${lang}` : `/routines?lang=${lang}`,
        { method: id ? "PUT" : "POST", body: JSON.stringify(input) },
      );
      return RoutineSchema.parse(raw);
    },
    onSuccess: (routine) => {
      queryClient.setQueryData(routineKeys.detail(routine.id, lang), routine);
      return queryClient.invalidateQueries({ queryKey: routineKeys.all });
    },
  });
}

export function useDeleteRoutineMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/routines/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: routineKeys.all }),
  });
}

/** Makes `routineId` the routine being followed, or clears it with null. */
export function useSetActiveRoutineMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (routineId: string | null) =>
      api<void>("/me/active-routine", {
        method: "PUT",
        body: JSON.stringify({ routineId }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: routineKeys.all }),
  });
}
