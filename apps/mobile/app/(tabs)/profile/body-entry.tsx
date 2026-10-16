import {
  BODY_METRICS,
  BODY_METRIC_KEYS,
  BodyMeasurementInputSchema,
  type BodyMetric,
} from "@pep-fit/shared-types";
import { Button, Card, IconButton, NumberInput } from "@pep-fit/ui";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";

import {
  useBodyMeasurementsQuery,
  useDeleteMeasurementMutation,
  useSaveMeasurementMutation,
} from "../../../src/features/body/api/body.queries";
import { useLocale } from "../../../src/i18n";
import { confirm } from "../../../src/lib/confirm";
import { addDaysToKey, todayKey } from "../../../src/lib/dates";
import { formatDate } from "../../../src/lib/format";

type Values = Record<BodyMetric, number | null>;
const EMPTY = Object.fromEntries(
  BODY_METRIC_KEYS.map((key) => [key, null]),
) as Values;

/** Log (or edit) the body entry for a day: `/profile/body-entry?day=YYYY-MM-DD`. */
export default function BodyEntryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useLocale();
  const params = useLocalSearchParams<{ day?: string }>();
  const today = todayKey();
  const [day, setDay] = useState(params.day ?? today);
  const [values, setValues] = useState<Values>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const { data: entries } = useBodyMeasurementsQuery();
  const save = useSaveMeasurementMutation();
  const remove = useDeleteMeasurementMutation();
  const existing = entries?.find((entry) => entry.measuredOn === day);

  // Show what's already logged for the chosen day (or a blank form).
  useEffect(() => {
    setValues(
      existing
        ? (Object.fromEntries(
            BODY_METRIC_KEYS.map((k) => [k, existing[k]]),
          ) as Values)
        : EMPTY,
    );
    setError(null);
  }, [existing, day]);

  const submit = async () => {
    const parsed = BodyMeasurementInputSchema.safeParse(values);
    if (!parsed.success) {
      setError(t("body.invalid"));
      return;
    }
    try {
      await save.mutateAsync({ day, input: parsed.data });
      router.back();
    } catch {
      setError(t("body.saveFailed"));
    }
  };

  const deleteEntry = async () => {
    const confirmed = await confirm({
      message: t("body.deleteConfirm"),
      confirmLabel: t("body.delete"),
      cancelLabel: t("common.cancel"),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(day);
      router.back();
    } catch {
      setError(t("body.saveFailed"));
    }
  };

  const date = new Date(`${day}T12:00:00`);

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen
        options={{ title: existing ? t("body.editEntry") : t("body.newEntry") }}
      />

      <Card className="flex-row items-center justify-between">
        <IconButton
          icon="◀"
          accessibilityLabel={t("body.previousDay")}
          onPress={() => setDay(addDaysToKey(day, -1))}
        />
        <Text className="font-semibold text-slate-900">
          {day === today ? `${t("body.today")} · ` : ""}
          {formatDate(date, lang)}
        </Text>
        <IconButton
          icon="▶"
          accessibilityLabel={t("body.nextDay")}
          onPress={() => setDay(addDaysToKey(day, 1))}
          disabled={day >= today}
        />
      </Card>

      <Card className="gap-3">
        {BODY_METRIC_KEYS.map((key) => (
          <View key={key} className="flex-row items-center gap-3">
            <Text className="flex-1 text-slate-800">
              {t(`body.metrics.${key}`)}
            </Text>
            <NumberInput
              className="w-24"
              decimal
              value={values[key]}
              onChange={(value) =>
                setValues((prev) => ({ ...prev, [key]: value }))
              }
              placeholder="–"
            />
            <Text className="w-8 text-slate-500">{BODY_METRICS[key].unit}</Text>
          </View>
        ))}
      </Card>

      <Text className="text-sm text-slate-500">{t("body.sameDayNote")}</Text>
      {error ? <Text className="text-red-600">{error}</Text> : null}

      <Button onPress={submit} disabled={save.isPending}>
        {save.isPending ? t("body.saving") : t("body.save")}
      </Button>
      {existing ? (
        <Button
          variant="danger"
          onPress={deleteEntry}
          disabled={remove.isPending}
        >
          {t("body.delete")}
        </Button>
      ) : null}
    </ScrollView>
  );
}
