import { Button } from "@pep-fit/ui";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, Text } from "react-native";

import {
  useDeletePhotoMutation,
  useProgressPhotosQuery,
} from "../../../../src/features/photos/api/photos.queries";
import { useLocale } from "../../../../src/i18n";
import { confirm } from "../../../../src/lib/confirm";
import { formatDate } from "../../../../src/lib/format";

export default function PhotoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: photos, isLoading } = useProgressPhotosQuery();
  const deletePhoto = useDeletePhotoMutation();
  const [error, setError] = useState(false);
  const photo = photos?.find((p) => p.id === id);

  const remove = async () => {
    const confirmed = await confirm({
      message: t("photos.deleteConfirm"),
      confirmLabel: t("photos.delete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await deletePhoto.mutateAsync(id);
      router.back();
    } catch {
      setError(true);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
    >
      <Stack.Screen options={{ title: t("photos.title") }} />
      {isLoading ? (
        <Text className="text-slate-500">{t("common.loading")}</Text>
      ) : !photo ? (
        <Text className="text-red-600">{t("photos.loadError")}</Text>
      ) : (
        <>
          <Text className="font-semibold text-slate-900">
            {formatDate(new Date(`${photo.takenOn}T12:00:00`), lang)} ·{" "}
            {t(`photos.poses.${photo.pose}`)}
          </Text>
          <Image
            source={{ uri: photo.url }}
            style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 16 }}
            resizeMode="contain"
          />
          {error ? (
            <Text className="text-red-600">{t("photos.deleteFailed")}</Text>
          ) : null}
          <Button
            variant="danger"
            onPress={remove}
            disabled={deletePhoto.isPending}
          >
            {t("photos.delete")}
          </Button>
        </>
      )}
    </ScrollView>
  );
}
