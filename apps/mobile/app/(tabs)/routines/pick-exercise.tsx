import type { Exercise } from "@pep-fit/shared-types";
import { Button } from "@pep-fit/ui";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExerciseBrowser } from "../../../src/features/exercises/components/ExerciseBrowser";
import { useRoutineDraftStore } from "../../../src/features/routines/useRoutineDraftStore";

/** Multi-select picker that appends exercises to a day of the routine draft. */
export default function PickExerciseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { dayKey } = useLocalSearchParams<{ dayKey: string }>();
  const addExercises = useRoutineDraftStore((state) => state.addExercises);
  // Insertion-ordered, so exercises are added in the order they were tapped.
  const [selected, setSelected] = useState<Map<string, Exercise>>(new Map());
  const selectedIds = useMemo(() => new Set(selected.keys()), [selected]);

  const toggle = (exercise: Exercise) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(exercise.id)) next.delete(exercise.id);
      else next.set(exercise.id, exercise);
      return next;
    });

  const confirmSelection = () => {
    addExercises(dayKey, [...selected.values()]);
    router.back();
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-slate-50">
      <Stack.Screen options={{ title: t("exercisePicker.title") }} />
      <ExerciseBrowser selectedIds={selectedIds} onPressExercise={toggle} />
      <View className="border-t border-slate-200 bg-white p-4">
        <Button onPress={confirmSelection} disabled={selected.size === 0}>
          {t("exercisePicker.add", { count: selected.size })}
        </Button>
      </View>
    </SafeAreaView>
  );
}
