import { useAuth } from "@clerk/expo";
import { Redirect, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { t } = useTranslation();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t("tabs.dashboard") }} />
      <Tabs.Screen name="routines" options={{ title: t("tabs.routines") }} />
      <Tabs.Screen name="exercises" options={{ title: t("tabs.exercises") }} />
      <Tabs.Screen name="profile" options={{ title: t("tabs.profile") }} />
      {/* Reached from the dashboard, not a tab of its own. */}
      <Tabs.Screen name="workout" options={{ href: null }} />
    </Tabs>
  );
}
