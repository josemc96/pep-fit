import "../global.css";

import { ClerkProvider } from "@clerk/expo";
import { QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
import { useEffect } from "react";

import { getDeviceLocale, i18n } from "../src/i18n";
import { queryClient } from "../src/lib/query-client";
import { tokenCache } from "../src/lib/token-cache";
import { useLanguageStore } from "../src/stores/useLanguageStore";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
}

function useApplyLanguagePreference() {
  const preference = useLanguageStore((state) => state.preference);

  useEffect(() => {
    void i18n.changeLanguage(
      preference === "system" ? getDeviceLocale() : preference,
    );
  }, [preference]);
}

export default function RootLayout() {
  useApplyLanguagePreference();

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
