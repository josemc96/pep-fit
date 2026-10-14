import { Card } from "@pep-fit/ui";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useLocale } from "../../../i18n";
import { useProgressQuery } from "../api/progress.queries";

/** Compact "this week" status for the dashboard. */
export function WeeklyProgressCard() {
  const { t } = useTranslation();
  const lang = useLocale();
  const { data: progress } = useProgressQuery(lang);

  if (!progress) return null;

  const { thisWeek, streak } = progress;
  const ratio = Math.min(1, thisWeek.daysTrained / thisWeek.goal);

  return (
    <Card className="gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-semibold text-slate-900">
          {t("progress.thisWeek")}
        </Text>
        <Text className="text-sm text-slate-600">
          {t("progress.daysOfGoal", {
            days: thisWeek.daysTrained,
            goal: thisWeek.goal,
          })}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-slate-200">
        <View
          className={`h-2 ${ratio >= 1 ? "bg-emerald-600" : "bg-indigo-600"}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </View>
      <Text className="text-sm text-slate-600">
        {t("progress.points", { points: thisWeek.points })} ·{" "}
        {t("progress.streak")}: {t("progress.weeks", { count: streak.current })}
      </Text>
    </Card>
  );
}
