import { ProgressSchema, type Locale } from "@pep-fit/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "../../../lib/useApi";

export const progressKeys = {
  all: ["progress"] as const,
  detail: (lang: Locale) => ["progress", lang] as const,
};

/** Points, scores, streak, weekly goal and recent records. */
export function useProgressQuery(lang: Locale) {
  const api = useApi();
  return useQuery({
    queryKey: progressKeys.detail(lang),
    queryFn: async () =>
      ProgressSchema.parse(await api<unknown>(`/progress?lang=${lang}`)),
  });
}

export function useSetWeeklyGoalMutation(lang: Locale) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (daysPerWeek: number) =>
      ProgressSchema.parse(
        await api<unknown>(`/progress/weekly-goal?lang=${lang}`, {
          method: "PUT",
          body: JSON.stringify({ daysPerWeek }),
        }),
      ),
    onSuccess: (progress) =>
      queryClient.setQueryData(progressKeys.detail(lang), progress),
  });
}
