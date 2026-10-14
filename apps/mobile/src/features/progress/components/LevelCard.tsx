import { levelForPoints } from "@pep-fit/shared-types";
import { Card } from "@pep-fit/ui";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useLocale } from "../../../i18n";
import { formatNumber } from "../../../lib/format";
import { useLevelName } from "../gamification";

/** Current level with a bar towards the next one. */
export function LevelCard({ totalPoints }: { totalPoints: number }) {
  const { t } = useTranslation();
  const lang = useLocale();
  const levelName = useLevelName();
  const level = levelForPoints(totalPoints);

  const next =
    level.nextMinPoints === null ? null : levelForPoints(level.nextMinPoints);
  const ratio =
    level.nextMinPoints === null
      ? 1
      : (totalPoints - level.minPoints) /
        (level.nextMinPoints - level.minPoints);

  return (
    <Card className="gap-2 border-indigo-200 bg-indigo-50">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-xl font-bold text-indigo-900">
          {levelName(level)}
        </Text>
        <Text className="font-semibold text-indigo-700">
          {t("progress.points", { points: formatNumber(totalPoints, lang) })}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-indigo-100">
        <View
          className="h-2 bg-indigo-600"
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </View>
      <Text className="text-sm text-indigo-800">
        {next && level.nextMinPoints !== null
          ? t("levels.toNext", {
              points: formatNumber(level.nextMinPoints - totalPoints, lang),
              level: levelName(next),
            })
          : t("levels.maxLevel")}
      </Text>
    </Card>
  );
}
