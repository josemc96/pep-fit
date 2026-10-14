import type { WorkoutSummary } from "@pep-fit/shared-types";
import { Card } from "@pep-fit/ui";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { useLocale } from "../../../i18n";
import {
  formatDate,
  formatDuration,
  formatNumber,
  formatTime,
} from "../../../lib/format";

/** Date, routine/day and totals of a finished workout. */
export function WorkoutSummaryCard({ workout }: { workout: WorkoutSummary }) {
  const { t } = useTranslation();
  const lang = useLocale();

  const title =
    [workout.routineName, workout.dayName].filter(Boolean).join(" · ") ||
    t("history.freeWorkout");
  const stats = [
    formatDuration(workout.startedAt, workout.finishedAt),
    t("history.exerciseCount", { count: workout.exerciseCount }),
    t("history.setCount", { count: workout.setCount }),
    ...(workout.volumeKg > 0
      ? [t("history.volume", { volume: formatNumber(workout.volumeKg, lang) })]
      : []),
  ];

  return (
    <Card className="gap-1">
      <Text className="text-xs font-medium uppercase text-slate-500">
        {formatDate(workout.startedAt, lang)} ·{" "}
        {formatTime(workout.startedAt, lang)}
      </Text>
      <Text className="text-base font-semibold text-slate-900">{title}</Text>
      <Text className="text-sm text-slate-600">{stats.join(" · ")}</Text>
    </Card>
  );
}
