import { Button, Card, Checkbox } from "@pep-fit/ui";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";

import {
  useCopyTemplateMutation,
  useTemplateQuery,
} from "../../../../src/features/templates/api/templates.queries";
import { useLocale } from "../../../../src/i18n";

/** Preview of a catalog routine, and saving a copy of it. */
export default function TemplateDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: template, isLoading, isError } = useTemplateQuery(id, lang);
  const copyTemplate = useCopyTemplateMutation(lang);
  const [followNow, setFollowNow] = useState(true);
  const [error, setError] = useState(false);

  const save = async () => {
    setError(false);
    try {
      const routine = await copyTemplate.mutateAsync({
        id,
        activate: followNow,
      });
      // Land on the user's own copy, ready to tweak.
      router.dismissTo("/routines");
      router.push(`/routines/${routine.id}`);
    } catch {
      setError(true);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
    >
      <Stack.Screen
        options={{ title: template?.name ?? t("templates.title") }}
      />

      {isLoading ? (
        <Text className="text-slate-500">{t("common.loading")}</Text>
      ) : isError || !template ? (
        <Text className="text-red-600">{t("templates.loadError")}</Text>
      ) : (
        <>
          <View className="gap-1">
            <Text className="text-xl font-bold text-slate-900">
              {template.name}
            </Text>
            <Text className="text-xs font-medium uppercase text-indigo-700">
              {[
                t("templates.daysPerWeek", { count: template.daysPerWeek }),
                t(`templates.levels.${template.level}`),
                t(`templates.equipment.${template.equipment}`),
              ].join(" · ")}
            </Text>
            <Text className="mt-1 text-slate-600">{template.description}</Text>
          </View>

          {template.days.map((day, index) => (
            <Card key={index} className="gap-2">
              <Text className="font-semibold text-slate-900">{day.name}</Text>
              {day.exercises.map((item, i) => (
                <View
                  key={i}
                  className="flex-row items-baseline justify-between gap-3"
                >
                  <Text className="flex-1 text-slate-800">
                    {item.exercise.name}
                  </Text>
                  <Text className="text-sm font-medium text-slate-600">
                    {t("templates.setsReps", {
                      sets: item.sets,
                      reps: item.reps,
                    })}
                    <Text className="text-xs text-slate-400">
                      {"  "}
                      {t("templates.rest", { seconds: item.restSeconds })}
                    </Text>
                  </Text>
                </View>
              ))}
            </Card>
          ))}

          <Text className="text-sm text-slate-500">
            {t("templates.noWeightsHint")}
          </Text>

          <Checkbox
            label={t("templates.followNow")}
            checked={followNow}
            onChange={setFollowNow}
          />
          {error ? (
            <Text className="text-red-600">{t("templates.copyFailed")}</Text>
          ) : null}
          <Button onPress={save} disabled={copyTemplate.isPending}>
            {copyTemplate.isPending
              ? t("templates.copying")
              : t("templates.use")}
          </Button>
        </>
      )}
    </ScrollView>
  );
}
