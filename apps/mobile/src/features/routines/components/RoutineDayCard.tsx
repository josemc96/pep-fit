import { ROUTINE_LIMITS } from "@pep-fit/shared-types";
import {
  Card,
  IconButton,
  Input,
  NumberInput,
  SetTable,
  type SetTableLabels,
} from "@pep-fit/ui";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { confirm } from "../../../lib/confirm";
import type { DraftDay, DraftExercise } from "../draft";
import { useRoutineDraftStore } from "../useRoutineDraftStore";

type ReorderProps = {
  isFirst: boolean;
  isLast: boolean;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
};

function ReorderControls({ isFirst, isLast, onMove, onRemove }: ReorderProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row">
      <IconButton
        icon="↑"
        accessibilityLabel={t("common.moveUp")}
        onPress={() => onMove(-1)}
        disabled={isFirst}
      />
      <IconButton
        icon="↓"
        accessibilityLabel={t("common.moveDown")}
        onPress={() => onMove(1)}
        disabled={isLast}
      />
      <IconButton
        icon="✕"
        tone="danger"
        accessibilityLabel={t("common.remove")}
        onPress={onRemove}
      />
    </View>
  );
}

function RoutineExerciseEditor({
  dayKey,
  item,
  isFirst,
  isLast,
}: {
  dayKey: string;
  item: DraftExercise;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const store = useRoutineDraftStore();

  const setLabels: SetTableLabels = {
    set: t("sets.set"),
    reps: t("sets.reps"),
    weight: t("sets.weight"),
    addSet: t("sets.addSet"),
    removeSet: t("sets.removeSet"),
  };

  return (
    <View className="gap-3 rounded-xl border border-slate-200 p-3">
      <View className="flex-row items-start gap-2">
        <Text className="flex-1 pt-1.5 font-semibold text-slate-900">
          {item.exercise.name}
        </Text>
        <ReorderControls
          isFirst={isFirst}
          isLast={isLast}
          onMove={(offset) => store.moveExercise(dayKey, item.key, offset)}
          onRemove={() => store.removeExercise(dayKey, item.key)}
        />
      </View>

      <SetTable
        rows={item.sets}
        labels={setLabels}
        maxRows={ROUTINE_LIMITS.maxSetsPerExercise}
        onChangeRow={(index, patch) =>
          store.updateSet(dayKey, item.key, index, patch)
        }
        onAddRow={() => store.addSet(dayKey, item.key)}
        onRemoveRow={(index) => store.removeSet(dayKey, item.key, index)}
      />

      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-slate-600">
          {t("routineEditor.restSeconds")}
        </Text>
        <NumberInput
          className="w-20"
          value={item.restSeconds}
          onChange={(seconds) =>
            store.setRestSeconds(
              dayKey,
              item.key,
              seconds === null
                ? null
                : Math.min(seconds, ROUTINE_LIMITS.maxRestSeconds),
            )
          }
        />
      </View>
    </View>
  );
}

type RoutineDayCardProps = {
  day: DraftDay;
  isFirst: boolean;
  isLast: boolean;
};

export function RoutineDayCard({ day, isFirst, isLast }: RoutineDayCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const store = useRoutineDraftStore();
  const canAddExercise =
    day.exercises.length < ROUTINE_LIMITS.maxExercisesPerDay;

  const removeDay = async () => {
    const confirmed =
      day.exercises.length === 0 ||
      (await confirm({
        message: t("routineEditor.removeDayConfirm"),
        confirmLabel: t("common.remove"),
        cancelLabel: t("common.cancel"),
        destructive: true,
      }));
    if (confirmed) store.removeDay(day.key);
  };

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <Input
            value={day.name}
            onChangeText={(name) => store.renameDay(day.key, name)}
            placeholder={t("routineEditor.dayNamePlaceholder")}
            maxLength={ROUTINE_LIMITS.nameMaxLength}
          />
        </View>
        <ReorderControls
          isFirst={isFirst}
          isLast={isLast}
          onMove={(offset) => store.moveDay(day.key, offset)}
          onRemove={removeDay}
        />
      </View>

      {day.exercises.length === 0 ? (
        <Text className="text-slate-500">{t("routineEditor.noExercises")}</Text>
      ) : (
        day.exercises.map((item, index) => (
          <RoutineExerciseEditor
            key={item.key}
            dayKey={day.key}
            item={item}
            isFirst={index === 0}
            isLast={index === day.exercises.length - 1}
          />
        ))
      )}

      {canAddExercise ? (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/routines/pick-exercise",
              params: { dayKey: day.key },
            })
          }
          className="items-center rounded-xl border border-dashed border-indigo-300 py-3"
        >
          <Text className="font-medium text-indigo-600">
            {t("routineEditor.addExercise")}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}
