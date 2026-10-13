import { useAuth } from "@clerk/expo";
import { useCallback } from "react";

import { apiFetch } from "./api-client";

/** `apiFetch` bound to the signed-in user's Clerk session token. */
export function useApi() {
  const { getToken } = useAuth();

  return useCallback(
    async <T>(path: string, init?: RequestInit): Promise<T> =>
      apiFetch<T>(path, { ...init, token: await getToken() }),
    [getToken],
  );
}
