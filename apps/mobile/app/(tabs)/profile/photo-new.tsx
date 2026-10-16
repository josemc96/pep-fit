import {
  PhotoPoseSchema,
  type PhotoContentType,
  type PhotoPose,
} from "@pep-fit/shared-types";
import { Button, Card, Chip, IconButton } from "@pep-fit/ui";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Platform, ScrollView, Text, View } from "react-native";

import { useUploadPhotoMutation } from "../../../src/features/photos/api/photos.queries";
import { photoContentType } from "../../../src/features/photos/contentType";
import { useLocale } from "../../../src/i18n";
import { addDaysToKey, todayKey } from "../../../src/lib/dates";
import { formatDate } from "../../../src/lib/format";

type Picked = { uri: string; contentType: PhotoContentType };

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 0.8,
};

export default function NewPhotoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useLocale();
  const upload = useUploadPhotoMutation();
  const today = todayKey();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [pose, setPose] = useState<PhotoPose>("front");
  const [day, setDay] = useState(today);
  const [error, setError] = useState<string | null>(null);

  const pick = async (source: "library" | "camera") => {
    setError(null);
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t("photos.permissionDenied"));
      return;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;

    const contentType = photoContentType(asset.mimeType, asset.uri);
    if (!contentType) {
      setError(t("photos.unsupportedType"));
      return;
    }
    setPicked({ uri: asset.uri, contentType });
  };

  const save = async () => {
    if (!picked) return;
    setError(null);
    try {
      await upload.mutateAsync({ ...picked, takenOn: day, pose });
      router.back();
    } catch {
      setError(t("photos.uploadFailed"));
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
    >
      <Stack.Screen options={{ title: t("photos.newTitle") }} />

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button variant="secondary" onPress={() => pick("library")}>
            {t("photos.pickFromLibrary")}
          </Button>
        </View>
        {/* The web picker can't open a camera reliably; phones can. */}
        {Platform.OS !== "web" ? (
          <View className="flex-1">
            <Button variant="secondary" onPress={() => pick("camera")}>
              {t("photos.takePhoto")}
            </Button>
          </View>
        ) : null}
      </View>

      {picked ? (
        <>
          <Image
            source={{ uri: picked.uri }}
            style={{ width: "100%", aspectRatio: 3 / 4, borderRadius: 16 }}
            resizeMode="contain"
          />

          <Card className="gap-2">
            <Text className="font-semibold text-slate-900">
              {t("photos.pose")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {PhotoPoseSchema.options.map((option) => (
                <Chip
                  key={option}
                  label={t(`photos.poses.${option}`)}
                  active={pose === option}
                  onPress={() => setPose(option)}
                />
              ))}
            </View>
          </Card>

          <Card className="flex-row items-center justify-between">
            <IconButton
              icon="◀"
              accessibilityLabel={t("body.previousDay")}
              onPress={() => setDay(addDaysToKey(day, -1))}
            />
            <Text className="font-semibold text-slate-900">
              {day === today ? `${t("body.today")} · ` : ""}
              {formatDate(new Date(`${day}T12:00:00`), lang)}
            </Text>
            <IconButton
              icon="▶"
              accessibilityLabel={t("body.nextDay")}
              onPress={() => setDay(addDaysToKey(day, 1))}
              disabled={day >= today}
            />
          </Card>
        </>
      ) : null}

      {error ? <Text className="text-red-600">{error}</Text> : null}
      {picked ? (
        <Button onPress={save} disabled={upload.isPending}>
          {upload.isPending ? t("photos.saving") : t("photos.save")}
        </Button>
      ) : null}
    </ScrollView>
  );
}
