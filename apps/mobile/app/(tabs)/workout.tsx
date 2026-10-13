import {
  Button,
  Card,
  RestTimer,
  SetTable,
  formatClock,
  type SetTableLabels,
} from "@pep-fit/ui";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  countSets,
  workoutToInput,
  type ActiveExercise,
} from "../../src/features/workout/activeWorkout";
import { useSaveWorkoutMutation } from "../../src/features/workout/api/workouts.queries";
import {
  useActiveWorkoutHydrated,
  useActiveWorkoutStore,
} from "../../src/features/workout/useActiveWorkoutStore";
import { confirm } from "../../src/lib/confirm";

function ElapsedTime({ since }: { since: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text className="text-2xl font-bold tabular-nums text-slate-900">
      {formatClock((now - Date.parse(since)) / 1000)}
    </Text>
  );
}

function WorkoutExerciseCard({ item }: { item: ActiveExercise }) {
  const { t } = useTranslation();
  const { updateSet, toggleSetCompleted, addSet, removeSet } =
    useActiveWorkoutStore();

  const labels: SetTableLabels = {
    set: t("sets.set"),
    reps: t("sets.reps"),
    weight: t("sets.weight"),
    addSet: t("sets.addSet"),
    removeSet: t("sets.removeSet"),
    completeSet: t("workout.completeSet"),
  };

  return (
    <Card className="gap-3">
      <Text className="text-base font-semibold text-slate-900">
        {item.exercise.name}
      </Text>
      <SetTable
        rows={item.sets}
        labels={labels}
        minRows={0}
        onChangeRow={(index, patch) => updateSet(item.key, index, patch)}
        onToggleCompleted={(index) => toggleSetCompleted(item.key, index)}
        onAddRow={() => addSet(item.key)}
        onRemoveRow={(index) => removeSet(item.key, index)}
      />
    </Card>
  );
}

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const hydrated = useActiveWorkoutHydrated();
  const { workout, restTimer, clear, addRestTime, skipRest } =
    useActiveWorkoutStore();
  const saveWorkout = useSaveWorkoutMutation();
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 p-4">
        <Text className="text-slate-500">{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView className="flex-1 gap-4 bg-slate-50 p-4">
        <Text className="text-slate-600">{t("workout.noWorkout")}</Text>
        <Button variant="secondary" onPress={() => router.replace("/")}>
          {t("workout.goHome")}
        </Button>
      </SafeAreaView>
    );
  }

  const sets = countSets(workout);

  const finish = async () => {
    setError(null);
    const input = workoutToInput(workout);
    if (!input) {
      setError(t("workout.nothingToSave"));
      return;
    }
    if (
      sets.completed < sets.total &&
      !(await confirm({
        message: t("workout.finishConfirm"),
        confirmLabel: t("workout.finishLabel"),
        cancelLabel: t("common.cancel"),
      }))
    ) {
      return;
    }

    try {
      await saveWorkout.mutateAsync(input);
      clear();
      router.replace({ pathname: "/", params: { saved: "1" } });
    } catch {
      setError(t("workout.saveFailed"));
    }
  };

  const discard = async () => {
    const confirmed = await confirm({
      message: t("workout.discardConfirm"),
      confirmLabel: t("workout.discardLabel"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (confirmed) {
      clear();
      router.replace("/");
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-slate-50">
      <View className="flex-row items-end justify-between border-b border-slate-200 bg-white px-4 pb-3 pt-4">
        <View className="flex-1">
          <Text className="text-xs font-medium uppercase text-slate-500">
            {workout.routineName ?? t("workout.title")}
          </Text>
          <Text className="text-xl font-bold text-slate-900">
            {workout.dayName ?? t("workout.title")}
          </Text>
          <Text className="text-sm text-slate-500">
            {t("workout.progress", sets)}
          </Text>
        </View>
        <ElapsedTime since={workout.startedAt} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        {workout.exercises.map((item) => (
          <WorkoutExerciseCard key={item.key} item={item} />
        ))}

        {error ? <Text className="text-red-600">{error}</Text> : null}

        <Button onPress={finish} disabled={saveWorkout.isPending}>
          {saveWorkout.isPending ? t("workout.finishing") : t("workout.finish")}
        </Button>
        <Button
          variant="danger"
          onPress={discard}
          disabled={saveWorkout.isPending}
        >
          {t("workout.discard")}
        </Button>
      </ScrollView>

      {restTimer ? (
        <RestTimer
          endsAt={restTimer.endsAt}
          totalSeconds={restTimer.totalSeconds}
          onAddTime={addRestTime}
          onSkip={skipRest}
          labels={{
            title: t("workout.rest.title"),
            done: t("workout.rest.done"),
            addTime: t("workout.rest.addTime"),
            skip: t("workout.rest.skip"),
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
