import { WEEKLY_GOAL_LIMITS } from "@pep-fit/shared-types";
import { Card, Chip } from "@pep-fit/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useLocale } from "../../../i18n";
import {
  formatDayMonth,
  formatMonth,
  formatNumber,
  formatSet,
} from "../../../lib/format";
import {
  useProgressQuery,
  useSetWeeklyGoalMutation,
} from "../api/progress.queries";

const GOAL_OPTIONS = Array.from(
  { length: WEEKLY_GOAL_LIMITS.max - WEEKLY_GOAL_LIMITS.min + 1 },
  (_, i) => WEEKLY_GOAL_LIMITS.min + i,
);

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <View className="min-w-[45%] flex-1 rounded-xl bg-slate-50 p-3">
      <Text className="text-xs font-medium uppercase text-slate-500">
        {label}
      </Text>
      <Text className="text-lg font-bold text-slate-900">{value}</Text>
      {hint ? <Text className="text-xs text-slate-500">{hint}</Text> : null}
    </View>
  );
}

/** Scores, streak, weekly goal and recent records (Profile tab). */
export function ProgressOverview() {
  const { t } = useTranslation();
  const lang = useLocale();
  const { data: progress, isLoading, isError } = useProgressQuery(lang);
  const setWeeklyGoal = useSetWeeklyGoalMutation(lang);
  const [goalError, setGoalError] = useState(false);

  if (isLoading) {
    return <Text className="text-slate-500">{t("common.loading")}</Text>;
  }
  if (isError || !progress) {
    return <Text className="text-red-600">{t("progress.loadError")}</Text>;
  }

  const points = (value: number) =>
    t("progress.points", { points: formatNumber(value, lang) });
  // The goal the user picked last: the pending one if there is one.
  const selectedGoal =
    progress.weeklyGoal.next?.daysPerWeek ?? progress.weeklyGoal.current;

  const chooseGoal = async (daysPerWeek: number) => {
    setGoalError(false);
    try {
      await setWeeklyGoal.mutateAsync(daysPerWeek);
    } catch {
      setGoalError(true);
    }
  };

  return (
    <>
      <Card className="gap-3">
        <Text className="text-lg font-bold text-slate-900">
          {t("progress.title")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <Stat
            label={t("progress.totalPoints")}
            value={points(progress.totalPoints)}
          />
          <Stat
            label={t("progress.thisWeek")}
            value={points(progress.thisWeek.points)}
            hint={t("progress.daysOfGoal", {
              days: progress.thisWeek.daysTrained,
              goal: progress.thisWeek.goal,
            })}
          />
          <Stat
            label={t("progress.bestWeek")}
            value={
              progress.bestWeek
                ? points(progress.bestWeek.points)
                : t("progress.noneYet")
            }
            hint={
              progress.bestWeek
                ? t("progress.weekOf", {
                    date: formatDayMonth(progress.bestWeek.period, lang),
                  })
                : undefined
            }
          />
          <Stat
            label={t("progress.thisMonth")}
            value={points(progress.thisMonth.points)}
          />
          <Stat
            label={t("progress.bestMonth")}
            value={
              progress.bestMonth
                ? points(progress.bestMonth.points)
                : t("progress.noneYet")
            }
            hint={
              progress.bestMonth
                ? formatMonth(progress.bestMonth.period, lang)
                : undefined
            }
          />
          <Stat
            label={t("progress.streak")}
            value={t("progress.weeks", { count: progress.streak.current })}
            hint={`${t("progress.bestStreak")}: ${t("progress.weeks", {
              count: progress.streak.best,
            })}`}
          />
        </View>
      </Card>

      <Card className="gap-2">
        <Text className="font-semibold text-slate-900">
          {t("progress.weeklyGoal")}
        </Text>
        <Text className="text-sm text-slate-500">
          {t("progress.weeklyGoalHint")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {GOAL_OPTIONS.map((days) => (
            <Chip
              key={days}
              label={String(days)}
              active={days === selectedGoal}
              onPress={() => chooseGoal(days)}
            />
          ))}
        </View>
        {progress.weeklyGoal.next ? (
          <Text className="text-sm text-indigo-700">
            {t("progress.goalPending", {
              count: progress.weeklyGoal.next.daysPerWeek,
              date: formatDayMonth(
                progress.weeklyGoal.next.effectiveFrom,
                lang,
              ),
            })}
          </Text>
        ) : null}
        {goalError ? (
          <Text className="text-sm text-red-600">
            {t("progress.goalSaveFailed")}
          </Text>
        ) : null}
      </Card>

      <Card className="gap-2">
        <Text className="font-semibold text-slate-900">
          {t("progress.recentRecords")}
        </Text>
        {progress.recentRecords.length === 0 ? (
          <Text className="text-sm text-slate-500">
            {t("progress.noRecords")}
          </Text>
        ) : (
          progress.recentRecords.map((record) => (
            <View key={`${record.workoutId}-${record.exerciseId}`}>
              <Text className="font-medium text-slate-800">
                {record.exerciseName}: {formatSet(record, lang)}
              </Text>
              <Text className="text-xs text-slate-500">
                {formatDayMonth(record.achievedAt, lang)} ·{" "}
                {t("progress.recordWas", {
                  previous: formatSet(record.previous, lang),
                })}
              </Text>
            </View>
          ))
        )}
      </Card>
    </>
  );
}
