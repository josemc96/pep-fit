import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useWorkoutHistoryQuery } from "../../../src/features/workout/api/workouts.queries";
import { WorkoutSummaryCard } from "../../../src/features/workout/components/WorkoutSummaryCard";

export default function HistoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWorkoutHistoryQuery();

  const workouts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <FlatList
        className="min-h-0 flex-1"
        data={workouts}
        keyExtractor={(workout) => workout.id}
        contentContainerClassName="gap-3 p-4"
        ListHeaderComponent={
          <Text className="text-xl font-bold text-slate-900">
            {t("history.title")}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/history/${item.id}`)}>
            <WorkoutSummaryCard workout={item} />
          </Pressable>
        )}
        ListEmptyComponent={
          isLoading ? (
            <Text className="text-slate-500">{t("common.loading")}</Text>
          ) : isError ? (
            <Text className="text-red-600">{t("history.loadError")}</Text>
          ) : (
            <Text className="text-slate-500">{t("history.empty")}</Text>
          )
        }
        ListFooterComponent={
          hasNextPage ? (
            <Pressable
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="items-center rounded-xl border border-slate-300 bg-white py-3"
            >
              <Text className="font-medium text-slate-700">
                {isFetchingNextPage
                  ? t("common.loading")
                  : t("common.loadMore")}
              </Text>
            </Pressable>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
