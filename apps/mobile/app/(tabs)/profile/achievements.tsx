import {
  ACHIEVEMENTS,
  AchievementCategorySchema,
  MEDAL_TIERS,
} from "@pep-fit/shared-types";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";

import { useProgressQuery } from "../../../src/features/progress/api/progress.queries";
import { AchievementRow } from "../../../src/features/progress/components/AchievementRow";
import { useLocale } from "../../../src/i18n";

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const lang = useLocale();
  const { data: progress, isLoading, isError } = useProgressQuery(lang);

  const unlocked =
    progress?.achievements.reduce((sum, a) => sum + a.tier, 0) ?? 0;
  const total = (progress?.achievements.length ?? 0) * MEDAL_TIERS.length;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
    >
      <Stack.Screen options={{ title: t("achievements.title") }} />

      {isLoading ? (
        <Text className="text-slate-500">{t("common.loading")}</Text>
      ) : isError || !progress ? (
        <Text className="text-red-600">{t("progress.loadError")}</Text>
      ) : (
        <>
          <Text className="text-base font-semibold text-slate-700">
            {t("achievements.unlockedCount", { count: unlocked, total })}
          </Text>
          {AchievementCategorySchema.options.map((category) => (
            <View key={category} className="gap-2">
              <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t(`achievements.categories.${category}`)}
              </Text>
              {progress.achievements
                .filter(
                  (status) => ACHIEVEMENTS[status.id].category === category,
                )
                .map((status) => (
                  <AchievementRow key={status.id} status={status} />
                ))}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}
