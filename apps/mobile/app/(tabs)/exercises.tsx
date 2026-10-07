import {
  EquipmentSchema,
  MuscleGroupSchema,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from "@pep-fit/shared-types";
import { Chip, ExerciseCard } from "@pep-fit/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useExercisesQuery } from "../../src/features/exercises/api/useExercisesQuery";
import { useLocale } from "../../src/i18n";

const MUSCLES = MuscleGroupSchema.options;
const EQUIPMENT = EquipmentSchema.options;

export default function ExercisesScreen() {
  const { t } = useTranslation();
  const lang = useLocale();
  const [muscle, setMuscle] = useState<MuscleGroup | undefined>();
  const [equipment, setEquipment] = useState<Equipment | undefined>();
  const [requiresWeight, setRequiresWeight] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Exercise[]>([]);

  useEffect(() => {
    setPage(1);
  }, [muscle, equipment, requiresWeight, lang]);

  const { data, isLoading, isFetching, isError } = useExercisesQuery({
    muscle,
    equipment,
    requiresWeight,
    page,
    lang,
  });

  useEffect(() => {
    if (!data) return;
    setItems((prev) =>
      data.page === 1 ? data.items : [...prev, ...data.items],
    );
  }, [data]);

  const canLoadMore = data ? data.page * data.pageSize < data.total : false;

  const subtitleFor = (exercise: Exercise) =>
    [
      t(`muscles.${exercise.primaryMuscle}`),
      exercise.equipment ? t(`equipment.${exercise.equipment}`) : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="gap-3 border-b border-slate-200 bg-white px-4 pb-3 pt-4">
        <Text className="text-xl font-bold text-slate-900">
          {t("exercises.title")}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          <Chip
            label={t("common.all")}
            active={!muscle}
            onPress={() => setMuscle(undefined)}
          />
          {MUSCLES.map((option) => (
            <Chip
              key={option}
              label={t(`muscles.${option}`)}
              active={muscle === option}
              onPress={() => setMuscle(option === muscle ? undefined : option)}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          <Chip
            label={t("exercises.anyEquipment")}
            active={!equipment}
            onPress={() => setEquipment(undefined)}
          />
          {EQUIPMENT.map((option) => (
            <Chip
              key={option}
              label={t(`equipment.${option}`)}
              active={equipment === option}
              onPress={() =>
                setEquipment(option === equipment ? undefined : option)
              }
            />
          ))}
        </ScrollView>

        <View className="flex-row gap-2">
          <Chip
            label={t("common.all")}
            active={requiresWeight === undefined}
            onPress={() => setRequiresWeight(undefined)}
          />
          <Chip
            label={t("exercises.withWeight")}
            active={requiresWeight === true}
            onPress={() => setRequiresWeight(true)}
          />
          <Chip
            label={t("exercises.withoutWeight")}
            active={requiresWeight === false}
            onPress={() => setRequiresWeight(false)}
          />
        </View>
      </View>

      {isError ? (
        <Text className="p-4 text-red-600">{t("exercises.loadError")}</Text>
      ) : (
        <FlatList
          className="min-h-0 flex-1"
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseCard exercise={item} subtitle={subtitleFor(item)} />
          )}
          contentContainerClassName="gap-2 p-4"
          ListEmptyComponent={
            isLoading ? (
              <Text className="text-slate-500">{t("common.loading")}</Text>
            ) : (
              <Text className="text-slate-500">{t("exercises.empty")}</Text>
            )
          }
          ListFooterComponent={
            canLoadMore ? (
              <Pressable
                onPress={() => setPage((prev) => prev + 1)}
                disabled={isFetching}
                className="items-center rounded-xl border border-slate-300 bg-white py-3"
              >
                <Text className="font-medium text-slate-700">
                  {isFetching ? t("common.loading") : t("common.loadMore")}
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
