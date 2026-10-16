import { Button, Card } from "@pep-fit/ui";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { useProgressPhotosQuery } from "../../../src/features/photos/api/photos.queries";
import { useLocale } from "../../../src/i18n";
import { formatDate } from "../../../src/lib/format";

/** Gallery of progress photos grouped by day, with a two-photo compare mode. */
export default function PhotosScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useLocale();
  const { data: photos, isLoading, isError } = useProgressPhotosQuery();
  const [comparing, setComparing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const byDay = new Map<string, NonNullable<typeof photos>>();
  for (const photo of photos ?? []) {
    byDay.set(photo.takenOn, [...(byDay.get(photo.takenOn) ?? []), photo]);
  }

  const onPhoto = (id: string) => {
    if (!comparing) {
      router.push(`/profile/photo/${id}`);
      return;
    }
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id].slice(-2);
    setSelected(next);
    if (next.length === 2) {
      router.push({
        pathname: "/profile/photo-compare",
        params: { a: next[0]!, b: next[1]! },
      });
      setComparing(false);
      setSelected([]);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
    >
      <Stack.Screen options={{ title: t("photos.title") }} />
      <Text className="text-sm text-slate-500">
        🔒 {t("photos.privateNote")}
      </Text>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button onPress={() => router.push("/profile/photo-new")}>
            {t("photos.add")}
          </Button>
        </View>
        {(photos?.length ?? 0) >= 2 ? (
          <View className="flex-1">
            <Button
              variant="secondary"
              onPress={() => {
                setComparing(!comparing);
                setSelected([]);
              }}
            >
              {comparing ? t("photos.cancelCompare") : t("photos.compare")}
            </Button>
          </View>
        ) : null}
      </View>
      {comparing ? (
        <Text className="font-medium text-indigo-700">
          {t("photos.compareHint")}
        </Text>
      ) : null}

      {isLoading ? (
        <Text className="text-slate-500">{t("common.loading")}</Text>
      ) : isError ? (
        <Text className="text-red-600">{t("photos.loadError")}</Text>
      ) : photos?.length === 0 ? (
        <Card>
          <Text className="text-slate-600">{t("photos.empty")}</Text>
        </Card>
      ) : (
        [...byDay].map(([day, dayPhotos]) => (
          <View key={day} className="gap-2">
            <Text className="text-xs font-bold uppercase text-slate-500">
              {formatDate(new Date(`${day}T12:00:00`), lang)}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {dayPhotos.map((photo) => (
                <Pressable
                  key={photo.id}
                  onPress={() => onPhoto(photo.id)}
                  className={`w-[31%] overflow-hidden rounded-xl border-2 ${
                    selected.includes(photo.id)
                      ? "border-indigo-600"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={{ width: "100%", aspectRatio: 3 / 4 }}
                    resizeMode="cover"
                  />
                  <Text className="bg-white px-1 py-0.5 text-center text-xs text-slate-600">
                    {t(`photos.poses.${photo.pose}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
