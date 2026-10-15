import {
  RoutineSchema,
  RoutineTemplateDetailSchema,
  RoutineTemplateSummarySchema,
  type Locale,
} from "@pep-fit/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api-client";
import { useApi } from "../../../lib/useApi";
import { routineKeys } from "../../routines/api/routines.queries";

export const templateKeys = {
  list: (lang: Locale) => ["routine-templates", lang] as const,
  detail: (id: string, lang: Locale) =>
    ["routine-templates", id, lang] as const,
};

/** The catalog is static, so it never needs refetching during a session. */
export function useTemplatesQuery(lang: Locale) {
  return useQuery({
    queryKey: templateKeys.list(lang),
    staleTime: Infinity,
    queryFn: async () =>
      RoutineTemplateSummarySchema.array().parse(
        await apiFetch<unknown>(`/routine-templates?lang=${lang}`),
      ),
  });
}

export function useTemplateQuery(id: string, lang: Locale) {
  return useQuery({
    queryKey: templateKeys.detail(id, lang),
    staleTime: Infinity,
    queryFn: async () =>
      RoutineTemplateDetailSchema.parse(
        await apiFetch<unknown>(`/routine-templates/${id}?lang=${lang}`),
      ),
  });
}

/** Copies a template into the user's routines; resolves with the copy. */
export function useCopyTemplateMutation(lang: Locale) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activate }: { id: string; activate: boolean }) =>
      RoutineSchema.parse(
        await api<unknown>(`/routine-templates/${id}/copy?lang=${lang}`, {
          method: "POST",
          body: JSON.stringify({ activate }),
        }),
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: routineKeys.all }),
  });
}
