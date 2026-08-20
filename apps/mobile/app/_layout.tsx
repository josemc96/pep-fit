import "../global.css";

import { ClerkProvider } from "@clerk/expo";
import { QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";

import { queryClient } from "../src/lib/query-client";
import { tokenCache } from "../src/lib/token-cache";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
