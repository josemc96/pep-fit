import { useAuth } from "@clerk/expo";
import { UserSchema } from "@pep-fit/shared-types";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api-client";

export function useCurrentUser() {
  const { isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["me"],
    enabled: isSignedIn ?? false,
    queryFn: async () => {
      const token = await getToken();
      const raw = await apiFetch<unknown>("/me", { token });
      return UserSchema.parse(raw);
    },
  });
}
