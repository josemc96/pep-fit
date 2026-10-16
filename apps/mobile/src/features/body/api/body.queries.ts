import {
  BodyMeasurementSchema,
  UserSchema,
  type BodyMeasurementInput,
  type UpdateUserInput,
} from "@pep-fit/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "../../../lib/useApi";

export const bodyKeys = { all: ["body-measurements"] as const };

/** All body entries, newest first. */
export function useBodyMeasurementsQuery() {
  const api = useApi();
  return useQuery({
    queryKey: bodyKeys.all,
    queryFn: async () =>
      BodyMeasurementSchema.array().parse(
        await api<unknown>("/body-measurements"),
      ),
  });
}

/** Creates or replaces the entry for a day ("YYYY-MM-DD"). */
export function useSaveMeasurementMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      day,
      input,
    }: {
      day: string;
      input: BodyMeasurementInput;
    }) =>
      BodyMeasurementSchema.parse(
        await api<unknown>(`/body-measurements/${day}`, {
          method: "PUT",
          body: JSON.stringify(input),
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bodyKeys.all }),
  });
}

export function useDeleteMeasurementMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (day: string) =>
      api<void>(`/body-measurements/${day}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bodyKeys.all }),
  });
}

/** Edits profile fields; the cached "me" is replaced with the result. */
export function useUpdateProfileMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserInput) =>
      UserSchema.parse(
        await api<unknown>("/me", {
          method: "PATCH",
          body: JSON.stringify(input),
        }),
      ),
    onSuccess: (user) => queryClient.setQueryData(["me"], user),
  });
}
