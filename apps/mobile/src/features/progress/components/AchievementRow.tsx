import {
  ACHIEVEMENTS,
  MEDAL_TIERS,
  type AchievementStatus,
} from "@pep-fit/shared-types";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useLocale } from "../../../i18n";
import {
  MEDAL_EMOJI,
  formatAchievementValue,
  useMedalName,
} from "../gamification";

/** One achievement: its best medal, the five tiers, and progress to the next. */
export function AchievementRow({ status }: { status: AchievementStatus }) {
  const { t } = useTranslation();
  const lang = useLocale();
  const medalName = useMedalName();
  const { thresholds } = ACHIEVEMENTS[status.id];

  const nextTier = status.tier < MEDAL_TIERS.length ? status.tier + 1 : null;
  const previousThreshold = status.tier > 0 ? thresholds[status.tier - 1]! : 0;
  const ratio =
    nextTier === null
      ? 1
      : (status.value - previousThreshold) /
        (thresholds[nextTier - 1]! - previousThreshold);

  return (
    <View className="flex-row gap-3 rounded-xl bg-white p-3">
      <Text className={`text-3xl ${status.tier === 0 ? "opacity-25" : ""}`}>
        {status.tier > 0 ? MEDAL_EMOJI[status.tier - 1] : "🏅"}
      </Text>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 font-semibold text-slate-900">
            {t(`achievements.items.${status.id}.name`)}
          </Text>
          <Text className="text-xs tracking-widest">
            {MEDAL_EMOJI.map((emoji, index) => (
              <Text
                key={emoji}
                className={index < status.tier ? "" : "opacity-20"}
              >
                {emoji}
              </Text>
            ))}
          </Text>
        </View>
        <Text className="text-sm text-slate-500">
          {t(`achievements.items.${status.id}.description`)}
        </Text>
        <View className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <View
            className={`h-1.5 ${nextTier === null ? "bg-emerald-600" : "bg-indigo-600"}`}
            style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
          />
        </View>
        <Text className="text-xs text-slate-600">
          {nextTier === null
            ? t("achievements.maxed")
            : t("achievements.nextTier", {
                current: formatAchievementValue(status.id, status.value, lang),
                target: formatAchievementValue(
                  status.id,
                  thresholds[nextTier - 1]!,
                  lang,
                ),
                medal: medalName(nextTier),
              })}
        </Text>
      </View>
    </View>
  );
}
