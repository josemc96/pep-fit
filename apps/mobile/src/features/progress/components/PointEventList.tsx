import type { PointEvent } from "@pep-fit/shared-types";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useLocale } from "../../../i18n";
import { formatSet } from "../../../lib/format";

/** One line per thing a workout earned, e.g. "Record in Squat: 105 kg × 2!  +10". */
export function PointEventList({ events }: { events: PointEvent[] }) {
  const { t } = useTranslation();
  const lang = useLocale();

  const describe = (event: PointEvent) => {
    switch (event.type) {
      case "personal_record":
        return t("progress.events.personal_record", {
          exercise: event.record?.exerciseName ?? "",
          set: event.record ? formatSet(event.record, lang) : "",
        });
      case "four_week_streak":
        return t("progress.events.four_week_streak", {
          weeks: event.streakWeeks,
        });
      default:
        return t(`progress.events.${event.type}`);
    }
  };

  return (
    <View className="gap-1">
      {events.map((event, index) => (
        <View key={index} className="flex-row items-center gap-2">
          <Text className="flex-1 text-slate-700">{describe(event)}</Text>
          <Text className="font-semibold text-emerald-700">
            +{event.points}
          </Text>
        </View>
      ))}
    </View>
  );
}
