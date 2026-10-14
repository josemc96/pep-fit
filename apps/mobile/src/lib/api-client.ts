import { getCalendars } from "expo-localization";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

/** IANA zone like "Europe/Madrid"; the API judges weeks in local time. */
function deviceTimeZone(): string {
  return (
    getCalendars()[0]?.timeZone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { token?: string | null },
): Promise<T> {
  const { token, ...rest } = init ?? {};

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      // Only when there is a body: Fastify rejects an empty JSON body (e.g. DELETE).
      ...(rest.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      "X-Timezone": deviceTimeZone(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
