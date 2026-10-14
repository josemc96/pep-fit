import { z } from "zod";

/** Medal tiers, lowest first. A tier index (1–5) is "how many reached". */
export const MEDAL_TIERS = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
] as const;
export type MedalTier = (typeof MEDAL_TIERS)[number];

/** Points for reaching each tier, in the same order as MEDAL_TIERS. */
export const MEDAL_POINTS = [10, 20, 40, 70, 100] as const;

export const AchievementCategorySchema = z.enum([
  "strength",
  "consistency",
  "records",
  "volume",
  "variety",
  "habits",
]);
export type AchievementCategory = z.infer<typeof AchievementCategorySchema>;

/** How an achievement's value is displayed. */
export type AchievementUnit = "kg" | "volumeKg" | "count";

type AchievementDefinition = {
  category: AchievementCategory;
  unit: AchievementUnit;
  /** Value needed for each tier, bronze → diamond. */
  thresholds: readonly [number, number, number, number, number];
};

/**
 * The achievement catalog (design agreed with the user). Order is display
 * order. Names and descriptions live in the app's translations.
 */
export const ACHIEVEMENTS = {
  // Strength: heaviest weight lifted in the lift (any reps).
  bench_king: {
    category: "strength",
    unit: "kg",
    thresholds: [40, 60, 80, 110, 140],
  },
  steel_legs: {
    category: "strength",
    unit: "kg",
    thresholds: [50, 80, 110, 140, 180],
  },
  deadlifter: {
    category: "strength",
    unit: "kg",
    thresholds: [60, 100, 140, 180, 220],
  },
  stone_shoulders: {
    category: "strength",
    unit: "kg",
    thresholds: [20, 35, 50, 65, 80],
  },
  pull_up_master: {
    category: "strength",
    unit: "count",
    thresholds: [1, 5, 10, 15, 20],
  },
  beast: {
    category: "strength",
    unit: "volumeKg",
    thresholds: [1000, 2500, 5000, 10000, 20000],
  },

  // Consistency.
  consistent: {
    category: "consistency",
    unit: "count",
    thresholds: [2, 4, 12, 26, 52],
  },
  unstoppable: {
    category: "consistency",
    unit: "count",
    thresholds: [2, 4, 8, 16, 26],
  },
  perfect_month: {
    category: "consistency",
    unit: "count",
    thresholds: [1, 2, 3, 6, 12],
  },
  extra_mile: {
    category: "consistency",
    unit: "count",
    thresholds: [2, 5, 20, 50, 100],
  },
  comeback: {
    category: "consistency",
    unit: "count",
    thresholds: [1, 2, 3, 5, 10],
  },

  // Records.
  record_breaker: {
    category: "records",
    unit: "count",
    thresholds: [1, 5, 25, 50, 100],
  },
  on_fire: { category: "records", unit: "count", thresholds: [2, 3, 4, 5, 6] },

  // Volume.
  workouts: {
    category: "volume",
    unit: "count",
    thresholds: [1, 10, 50, 100, 250],
  },
  sets: {
    category: "volume",
    unit: "count",
    thresholds: [50, 100, 1000, 2500, 5000],
  },
  reps: {
    category: "volume",
    unit: "count",
    thresholds: [500, 1000, 10000, 25000, 50000],
  },
  tonnage: {
    category: "volume",
    unit: "volumeKg",
    thresholds: [1000, 10000, 50000, 100000, 500000],
  },

  // Variety.
  explorer: {
    category: "variety",
    unit: "count",
    thresholds: [5, 15, 30, 50, 80],
  },
  full_body: {
    category: "variety",
    unit: "count",
    thresholds: [1, 3, 5, 10, 20],
  },
  leg_day: {
    category: "variety",
    unit: "count",
    thresholds: [1, 10, 50, 100, 150],
  },
  bodyweight: {
    category: "variety",
    unit: "count",
    thresholds: [10, 50, 250, 500, 1000],
  },

  // Habits.
  early_bird: {
    category: "habits",
    unit: "count",
    thresholds: [1, 5, 20, 35, 50],
  },
  night_owl: {
    category: "habits",
    unit: "count",
    thresholds: [1, 5, 20, 35, 50],
  },
  weekend_warrior: {
    category: "habits",
    unit: "count",
    thresholds: [1, 5, 20, 35, 50],
  },
  marathoner: {
    category: "habits",
    unit: "count",
    thresholds: [1, 5, 10, 20, 30],
  },
} as const satisfies Record<string, AchievementDefinition>;

export type AchievementId = keyof typeof ACHIEVEMENTS;
export const ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENTS) as AchievementId[];
export const AchievementIdSchema = z.enum(
  ACHIEVEMENT_IDS as [AchievementId, ...AchievementId[]],
);

/** Tiers reached (0–5) with a given value. */
export function tierFor(id: AchievementId, value: number): number {
  return ACHIEVEMENTS[id].thresholds.filter((threshold) => value >= threshold)
    .length;
}

export const AchievementStatusSchema = z.object({
  id: AchievementIdSchema,
  value: z.number(),
  /** Tiers reached, 0 (none) to 5 (diamond). */
  tier: z.number().int().min(0).max(MEDAL_TIERS.length),
  /** When each tier was reached (null while locked), bronze → diamond. */
  unlockedAt: z.array(z.coerce.date().nullable()),
});
export type AchievementStatus = z.infer<typeof AchievementStatusSchema>;
