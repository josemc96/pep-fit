import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="body" />
      <Stack.Screen name="body-entry" />
    </Stack>
  );
}
