import { Button, Card, Screen } from "@pep-fit/ui";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useRoutinesQuery } from "../../../src/features/routines/api/routines.queries";

export default function RoutinesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: routines, isLoading, isError } = useRoutinesQuery();

  return (
    <Screen>
      <Text className="text-xl font-bold text-slate-900">
        {t("routines.title")}
      </Text>

      <Button onPress={() => router.push("/routines/new")}>
        {t("routines.new")}
      </Button>
      <Button
        variant="secondary"
        onPress={() => router.push("/routines/templates")}
      >
        {t("templates.explore")}
      </Button>

      {isLoading ? (
        <Text className="text-slate-500">{t("common.loading")}</Text>
      ) : isError ? (
        <Text className="text-red-600">{t("routines.loadError")}</Text>
      ) : routines?.length === 0 ? (
        <Card>
          <Text className="text-slate-500">{t("routines.empty")}</Text>
        </Card>
      ) : (
        routines?.map((routine) => (
          <Pressable
            key={routine.id}
            onPress={() => router.push(`/routines/${routine.id}`)}
          >
            <Card
              className={routine.isActive ? "border-indigo-600" : undefined}
            >
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-base font-semibold text-slate-900">
                  {routine.name}
                </Text>
                {routine.isActive ? (
                  <Text className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {t("routines.activeBadge")}
                  </Text>
                ) : null}
              </View>
              <Text className="mt-1 text-slate-500">
                {t("routines.dayCount", { count: routine.dayCount })}
              </Text>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
