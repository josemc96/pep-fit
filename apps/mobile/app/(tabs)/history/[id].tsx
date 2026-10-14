import { Button, Card } from "@pep-fit/ui";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";

import {
  useDeleteWorkoutMutation,
  useWorkoutQuery,
} from "../../../src/features/workout/api/workouts.queries";
import { WorkoutSummaryCard } from "../../../src/features/workout/components/WorkoutSummaryCard";
import { useLocale } from "../../../src/i18n";
import { confirm } from "../../../src/lib/confirm";
import { formatSet } from "../../../src/lib/format";

export default function WorkoutDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: workout, isLoading, isError } = useWorkoutQuery(id, lang);
  const deleteWorkout = useDeleteWorkoutMutation();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    const confirmed = await confirm({
      message: t("history.deleteConfirm"),
      confirmLabel: t("history.delete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteWorkout.mutateAsync(id);
      router.back();
    } catch {
      setError(t("history.deleteFailed"));
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
    >
      <Stack.Screen options={{ title: t("history.title") }} />

      {isLoading ? (
        <Text className="text-slate-500">{t("common.loading")}</Text>
      ) : isError || !workout ? (
        <Text className="text-red-600">{t("history.notFound")}</Text>
      ) : (
        <>
          <WorkoutSummaryCard workout={workout} />

          {workout.exercises.map((item) => (
            <Card key={item.id} className="gap-2">
              <Text className="text-base font-semibold text-slate-900">
                {item.exercise.name}
              </Text>
              {item.sets.map((set, index) => (
                <View key={index} className="flex-row gap-3">
                  <Text className="w-16 text-slate-500">
                    {t("sets.set")} {index + 1}
                  </Text>
                  <Text className="font-medium text-slate-800">
                    {formatSet(set, lang)}
                  </Text>
                </View>
              ))}
            </Card>
          ))}

          {error ? <Text className="text-red-600">{error}</Text> : null}

          <Button
            variant="danger"
            onPress={handleDelete}
            disabled={deleteWorkout.isPending}
          >
            {t("history.delete")}
          </Button>
        </>
      )}
    </ScrollView>
  );
}
