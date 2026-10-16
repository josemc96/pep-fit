import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="body" />
      <Stack.Screen name="body-entry" />
      <Stack.Screen name="photos" />
      <Stack.Screen name="photo-new" />
      <Stack.Screen name="photo/[id]" />
      <Stack.Screen name="photo-compare" />
    </Stack>
  );
}
