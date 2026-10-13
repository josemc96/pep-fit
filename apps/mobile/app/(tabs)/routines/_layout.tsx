import { Stack } from "expo-router";

export default function RoutinesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="pick-exercise" options={{ presentation: "modal" }} />
    </Stack>
  );
}
