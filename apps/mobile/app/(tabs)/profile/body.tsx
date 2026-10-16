import { BODY_METRICS, BODY_METRIC_KEYS } from "@pep-fit/shared-types";
import { Button, Card } from "@pep-fit/ui";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useCurrentUser } from "../../../src/features/auth/hooks/useCurrentUser";
import { useBodyMeasurementsQuery } from "../../../src/features/body/api/body.queries";
import { WeightChart } from "../../../src/features/body/components/WeightChart";
import {
  latestValues,
  weightChanges,
  weightSeries,
} from "../../../src/features/body/stats";
import { useLocale } from "../../../src/i18n";
import { formatDayMonth, formatNumber } from "../../../src/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 rounded-xl bg-slate-50 p-3">
      <Text className="text-xs font-medium uppercase text-slate-500">
        {label}
      </Text>
      <Text className="text-lg font-bold text-slate-900">{value}</Text>
    </View>
  );
}

export default function BodyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useLocale();
  const { data: user } = useCurrentUser();
  const { data: entries, isLoading, isError } = useBodyMeasurementsQuery();

  const kg = (value: number) => `${formatNumber(value, lang)} kg`;
  const signedKg = (value: number) =>
    `${value > 0 ? "+" : value < 0 ? "−" : "±"}${formatNumber(Math.abs(value), lang)} kg`;

  const series = entries ? weightSeries(entries) : [];
  const changes = weightChanges(series);
  const latest = entries ? latestValues(entries) : {};
  const targetKg = user?.targetWeight ?? null;

  const openEntry = (day?: string) =>
    router.push({
      pathname: "/profile/body-entry",
      params: day ? { day } : {},
    });

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="gap-4 p-4 pb-12"
    >
      <Stack.Screen options={{ title: t("body.title") }} />
      <Text className="text-sm text-slate-500">🔒 {t("body.privateNote")}</Text>
      <Button onPress={() => openEntry()}>{t("body.addEntry")}</Button>

      {isLoading ? (
        <Text className="text-slate-500">{t("common.loading")}</Text>
      ) : isError || !entries ? (
        <Text className="text-red-600">{t("body.loadError")}</Text>
      ) : entries.length === 0 ? (
        <Card>
          <Text className="text-slate-600">{t("body.empty")}</Text>
        </Card>
      ) : (
        <>
          {changes ? (
            <Card className="gap-3">
              <View className="flex-row flex-wrap gap-2">
                <Stat label={t("body.current")} value={kg(changes.latest)} />
                <Stat
                  label={t("body.sinceStart")}
                  value={signedKg(changes.sinceStart)}
                />
                {changes.sincePrevious !== null ? (
                  <Stat
                    label={t("body.sincePrevious")}
                    value={signedKg(changes.sincePrevious)}
                  />
                ) : null}
                {targetKg !== null ? (
                  <Stat label={t("body.target")} value={kg(targetKg)} />
                ) : null}
              </View>
              <Text className="font-semibold text-slate-900">
                {t("body.chartTitle")}
              </Text>
              {series.length >= 2 ? (
                <WeightChart
                  points={series}
                  targetKg={targetKg}
                  locale={lang}
                />
              ) : (
                <Text className="text-sm text-slate-500">
                  {t("body.chartEmpty")}
                </Text>
              )}
            </Card>
          ) : null}

          <Card className="gap-2">
            <Text className="font-semibold text-slate-900">
              {t("body.latestMeasurements")}
            </Text>
            {BODY_METRIC_KEYS.filter(
              (key) => key !== "weightKg" && latest[key],
            ).map((key) => (
              <View key={key} className="flex-row justify-between">
                <Text className="text-slate-700">
                  {t(`body.metrics.${key}`)}
                </Text>
                <Text className="text-slate-900">
                  {formatNumber(latest[key]!.value, lang)}{" "}
                  {BODY_METRICS[key].unit}
                  <Text className="text-xs text-slate-400">
                    {"  "}
                    {formatDayMonth(latest[key]!.day, lang)}
                  </Text>
                </Text>
              </View>
            ))}
          </Card>

          <Card className="gap-1">
            <Text className="mb-1 font-semibold text-slate-900">
              {t("body.history")}
            </Text>
            {entries.map((entry) => (
              <Pressable
                key={entry.measuredOn}
                onPress={() => openEntry(entry.measuredOn)}
                className="flex-row justify-between gap-3 border-t border-slate-100 py-2"
              >
                <Text className="w-20 text-slate-500">
                  {formatDayMonth(entry.measuredOn, lang)}
                </Text>
                <Text className="flex-1 text-right text-slate-800">
                  {BODY_METRIC_KEYS.filter((key) => entry[key] !== null)
                    .map(
                      (key) =>
                        `${t(`body.metrics.${key}`)} ${formatNumber(entry[key]!, lang)} ${BODY_METRICS[key].unit}`,
                    )
                    .join(" · ")}
                </Text>
              </Pressable>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
