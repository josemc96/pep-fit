import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, Text, View } from "react-native";

import { useProgressPhotosQuery } from "../../../src/features/photos/api/photos.queries";
import { useLocale } from "../../../src/i18n";
import { formatDate } from "../../../src/lib/format";

/** Two photos side by side, older one first: before / after. */
export default function PhotoCompareScreen() {
  const { t } = useTranslation();
  const lang = useLocale();
  const { a, b } = useLocalSearchParams<{ a: string; b: string }>();
  const { data: photos, isLoading } = useProgressPhotosQuery();

  const pair = [a, b]
    .map((id) => photos?.find((photo) => photo.id === id))
    .filter((photo) => photo !== undefined)
    .sort((x, y) => x.takenOn.localeCompare(y.takenOn));

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
    >
      <Stack.Screen options={{ title: t("photos.compareTitle") }} />
      {isLoading ? (
        <Text className="text-slate-500">{t("common.loading")}</Text>
      ) : pair.length !== 2 ? (
        <Text className="text-red-600">{t("photos.loadError")}</Text>
      ) : (
        <View className="flex-row gap-2">
          {pair.map((photo, index) => (
            <View key={photo.id} className="flex-1 gap-1">
              <Text className="text-center font-bold text-slate-900">
                {index === 0 ? t("photos.before") : t("photos.after")}
              </Text>
              <Image
                source={{ uri: photo.url }}
                style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 12 }}
                resizeMode="cover"
              />
              <Text className="text-center text-xs text-slate-500">
                {formatDate(new Date(`${photo.takenOn}T12:00:00`), lang)} ·{" "}
                {t(`photos.poses.${photo.pose}`)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
