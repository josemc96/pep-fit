import { ROUTINE_LIMITS, RoutineInputSchema } from "@pep-fit/shared-types";
import { Button, Input } from "@pep-fit/ui";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import {
  useDeleteRoutineMutation,
  useRoutineQuery,
  useSaveRoutineMutation,
  useSetActiveRoutineMutation,
} from "../../../src/features/routines/api/routines.queries";
import { RoutineDayCard } from "../../../src/features/routines/components/RoutineDayCard";
import {
  canAddDay,
  draftFromRoutine,
  draftToInput,
  emptyDraft,
} from "../../../src/features/routines/draft";
import { useRoutineDraftStore } from "../../../src/features/routines/useRoutineDraftStore";
import { useTemplatesQuery } from "../../../src/features/templates/api/templates.queries";
import { useLocale } from "../../../src/i18n";
import { confirm } from "../../../src/lib/confirm";

type Feedback = { tone: "success" | "error"; message: string } | null;

/** Create (`/routines/new`) or edit (`/routines/<id>`) a routine. */
export default function RoutineEditorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routineId = id === "new" ? null : id;

  const routineQuery = useRoutineQuery(routineId, lang);
  const templates = useTemplatesQuery(lang);
  const sourceTemplate = templates.data?.find(
    (template) => template.id === routineQuery.data?.sourceTemplateId,
  );
  const saveRoutine = useSaveRoutineMutation(lang);
  const deleteRoutine = useDeleteRoutineMutation();
  const setActiveRoutine = useSetActiveRoutineMutation();

  const { draft, reset, setName, addDay } = useRoutineDraftStore();
  const [loadedId, setLoadedId] = useState<string | null | undefined>();
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Seed the draft once per routine. Later refetches (after saving,
  // activating or switching language) must not wipe in-progress edits.
  useEffect(() => {
    if (routineId === null && loadedId !== null) {
      reset(emptyDraft(t("routineEditor.defaultDayName", { number: 1 })));
      setLoadedId(null);
    } else if (routineQuery.data && loadedId !== routineQuery.data.id) {
      reset(draftFromRoutine(routineQuery.data));
      setLoadedId(routineQuery.data.id);
    }
  }, [routineId, routineQuery.data, loadedId, reset, t]);

  const isActive = routineQuery.data?.isActive ?? false;
  const isReady =
    routineId === null ? loadedId === null : loadedId === routineId;

  const handleSave = async () => {
    const parsed = RoutineInputSchema.safeParse(draftToInput(draft));
    if (!parsed.success) {
      setFeedback({
        tone: "error",
        message: t("routineEditor.errors.invalid"),
      });
      return;
    }

    try {
      const saved = await saveRoutine.mutateAsync({
        id: routineId,
        input: parsed.data,
      });
      setFeedback({ tone: "success", message: t("routineEditor.saved") });
      if (routineId === null) {
        router.replace(`/routines/${saved.id}`);
      }
    } catch {
      setFeedback({
        tone: "error",
        message: t("routineEditor.errors.saveFailed"),
      });
    }
  };

  const handleToggleActive = async () => {
    if (!routineId) return;
    try {
      await setActiveRoutine.mutateAsync(isActive ? null : routineId);
    } catch {
      setFeedback({
        tone: "error",
        message: t("routineEditor.errors.actionFailed"),
      });
    }
  };

  const handleDelete = async () => {
    if (!routineId) return;
    const confirmed = await confirm({
      message: t("routineEditor.deleteConfirm"),
      confirmLabel: t("routineEditor.delete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteRoutine.mutateAsync(routineId);
      router.back();
    } catch {
      setFeedback({
        tone: "error",
        message: t("routineEditor.errors.actionFailed"),
      });
    }
  };

  const title = t(
    routineId ? "routineEditor.editTitle" : "routineEditor.newTitle",
  );

  if (routineQuery.isError) {
    return (
      <View className="flex-1 bg-slate-50 p-4">
        <Stack.Screen options={{ title }} />
        <Text className="text-red-600">
          {t("routineEditor.errors.loadFailed")}
        </Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View className="flex-1 bg-slate-50 p-4">
        <Stack.Screen options={{ title }} />
        <Text className="text-slate-500">{t("common.loading")}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title }} />

      <Input
        value={draft.name}
        onChangeText={setName}
        placeholder={t("routineEditor.namePlaceholder")}
        maxLength={ROUTINE_LIMITS.nameMaxLength}
      />

      {isActive ? (
        <Text className="font-medium text-indigo-600">
          {t("routineEditor.activeNotice")}
        </Text>
      ) : null}
      {sourceTemplate ? (
        <Text className="text-sm text-slate-500">
          {t("templates.basedOn", { name: sourceTemplate.name })}
        </Text>
      ) : null}

      {draft.days.map((day, index) => (
        <RoutineDayCard
          key={day.key}
          day={day}
          isFirst={index === 0}
          isLast={index === draft.days.length - 1}
        />
      ))}

      {canAddDay(draft) ? (
        <Pressable
          onPress={() =>
            addDay(
              t("routineEditor.defaultDayName", {
                number: draft.days.length + 1,
              }),
            )
          }
          className="items-center rounded-2xl border border-dashed border-slate-300 py-4"
        >
          <Text className="font-medium text-slate-700">
            {t("routineEditor.addDay")}
          </Text>
        </Pressable>
      ) : null}

      {feedback ? (
        <Text
          className={
            feedback.tone === "error" ? "text-red-600" : "text-emerald-700"
          }
        >
          {feedback.message}
        </Text>
      ) : null}

      <Button onPress={handleSave} disabled={saveRoutine.isPending}>
        {saveRoutine.isPending
          ? t("routineEditor.saving")
          : t("routineEditor.save")}
      </Button>

      {routineId ? (
        <>
          <Button
            variant="secondary"
            onPress={handleToggleActive}
            disabled={setActiveRoutine.isPending}
          >
            {isActive
              ? t("routineEditor.deactivate")
              : t("routineEditor.activate")}
          </Button>
          <Button
            variant="danger"
            onPress={handleDelete}
            disabled={deleteRoutine.isPending}
          >
            {t("routineEditor.delete")}
          </Button>
        </>
      ) : null}
    </ScrollView>
  );
}
