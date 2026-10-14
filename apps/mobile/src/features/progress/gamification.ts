import {
  ACHIEVEMENTS,
  MEDAL_TIERS,
  type AchievementId,
  type Level,
  type Locale,
} from "@pep-fit/shared-types";
import { useTranslation } from "react-i18next";

import { formatNumber } from "../../lib/format";

/** Bronze → diamond. */
export const MEDAL_EMOJI = ["🥉", "🥈", "🥇", "💠", "💎"] as const;

const ROMAN = ["I", "II", "III"] as const;

/** e.g. "Recluta II" / "Recruit II". */
export function useLevelName() {
  const { t } = useTranslation();
  return (level: Pick<Level, "rank" | "sublevel">) =>
    `${t(`levels.ranks.${level.rank}`)} ${ROMAN[level.sublevel - 1]}`;
}

/** "Oro" / "Gold" for a 1-based tier. */
export function useMedalName() {
  const { t } = useTranslation();
  return (tier: number) =>
    `${MEDAL_EMOJI[tier - 1]} ${t(`achievements.tiers.${MEDAL_TIERS[tier - 1]!}`)}`;
}

/** An achievement value in its unit: "85 kg", "12,5 t", "37". */
export function formatAchievementValue(
  id: AchievementId,
  value: number,
  locale: Locale,
): string {
  switch (ACHIEVEMENTS[id].unit) {
    case "kg":
      return `${formatNumber(value, locale)} kg`;
    case "volumeKg":
      return value >= 1000
        ? `${formatNumber(value / 1000, locale)} t`
        : `${formatNumber(value, locale)} kg`;
    case "count":
      return formatNumber(value, locale);
  }
}
