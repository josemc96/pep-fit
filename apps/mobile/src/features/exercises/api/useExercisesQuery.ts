import {
  ExercisePageSchema,
  type Equipment,
  type Locale,
  type MuscleGroup,
} from "@pep-fit/shared-types";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api-client";

export interface ExercisesFilters {
  muscle?: MuscleGroup;
  equipment?: Equipment;
  requiresWeight?: boolean;
  page: number;
  lang: Locale;
}

export function useExercisesQuery(filters: ExercisesFilters) {
  return useQuery({
    queryKey: ["exercises", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.muscle) params.set("muscle", filters.muscle);
      if (filters.equipment) params.set("equipment", filters.equipment);
      if (filters.requiresWeight !== undefined) {
        params.set("requiresWeight", String(filters.requiresWeight));
      }
      params.set("page", String(filters.page));
      params.set("lang", filters.lang);

      const raw = await apiFetch<unknown>(`/exercises?${params.toString()}`);
      return ExercisePageSchema.parse(raw);
    },
  });
}
