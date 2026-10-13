import { nextRoutineDayIndex } from "@pep-fit/shared-types";
import { Button, Card, Chip, Screen } from "@pep-fit/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import {
  useRoutineQuery,
  useRoutinesQuery,
} from "../../src/features/routines/api/routines.queries";
import { workoutFromRoutineDay } from "../../src/features/workout/activeWorkout";
import { useLatestWorkoutQuery } from "../../src/features/workout/api/workouts.queries";
import {
  useActiveWorkoutHydrated,
  useActiveWorkoutStore,
} from "../../src/features/workout/useActiveWorkoutStore";
import { useLocale } from "../../src/i18n";

function StartWorkoutCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useLocale();
  const startWorkout = useActiveWorkoutStore((state) => state.start);

  const routines = useRoutinesQuery();
  const activeRoutineId =
    routines.data?.find((routine) => routine.isActive)?.id ?? null;
  const routine = useRoutineQuery(activeRoutineId, lang);
  const latest = useLatestWorkoutQuery(activeRoutineId);
  const [chosenDay, setChosenDay] = useState<number | null>(null);

  if (routines.isLoading || routine.isLoading || latest.isLoading) {
    return <Text className="text-slate-500">{t("common.loading")}</Text>;
  }
  if (routines.isError || routine.isError || latest.isError) {
    return <Text className="text-red-600">{t("dashboard.loadError")}</Text>;
  }

  if (!routine.data) {
    return (
      <Card className="gap-3">
        <Text className="text-slate-600">{t("dashboard.noActiveRoutine")}</Text>
        <Button variant="secondary" onPress={() => router.push("/routines")}>
          {t("dashboard.goToRoutines")}
        </Button>
      </Card>
    );
  }

  const { days } = routine.data;
  const suggestedDay = nextRoutineDayIndex(
    latest.data?.routineDayIndex,
    days.length,
  );
  const dayIndex =
    chosenDay !== null && chosenDay < days.length ? chosenDay : suggestedDay;
  const day = days[dayIndex];

  const start = () => {
    startWorkout(workoutFromRoutineDay(routine.data, dayIndex));
    router.push("/workout");
  };

  return (
    <Card className="gap-3">
      <Text className="text-lg font-bold text-slate-900">
        {routine.data.name}
      </Text>

      <Text className="text-sm font-medium text-slate-600">
        {t("dashboard.chooseDay")}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {days.map((d, index) => (
          <Chip
            key={d.id}
            label={d.name}
            active={index === dayIndex}
            onPress={() => setChosenDay(index)}
          />
        ))}
      </View>

      {day && day.exercises.length > 0 ? (
        <>
          <View className="gap-1">
            {day.exercises.map((routineExercise) => (
              <Text key={routineExercise.id} className="text-slate-700">
                • {routineExercise.exercise.name} ·{" "}
                {routineExercise.sets.length}×
              </Text>
            ))}
          </View>
          <Button onPress={start}>{t("dashboard.startWorkout")}</Button>
        </>
      ) : (
        <Text className="text-slate-500">{t("dashboard.emptyDay")}</Text>
      )}
    </Card>
  );
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { saved } = useLocalSearchParams<{ saved?: string }>();
  const hydrated = useActiveWorkoutHydrated();
  const workout = useActiveWorkoutStore((state) => state.workout);

  return (
    <Screen>
      <Text className="text-xl font-bold text-slate-900">
        {t("dashboard.title")}
      </Text>

      {saved && !workout ? (
        <Card className="border-emerald-300 bg-emerald-50">
          <Text className="font-semibold text-emerald-800">
            {t("dashboard.workoutSaved")}
          </Text>
        </Card>
      ) : null}

      {!hydrated ? (
        <Text className="text-slate-500">{t("common.loading")}</Text>
      ) : workout ? (
        <Card className="gap-3 border-indigo-300">
          <Text className="font-semibold text-slate-900">
            {t("dashboard.inProgress")}
          </Text>
          <Text className="text-slate-600">
            {[workout.routineName, workout.dayName].filter(Boolean).join(" · ")}
          </Text>
          <Button onPress={() => router.push("/workout")}>
            {t("dashboard.continueWorkout")}
          </Button>
        </Card>
      ) : (
        <StartWorkoutCard />
      )}
    </Screen>
  );
}
