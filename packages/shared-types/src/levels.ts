import { z } from "zod";

export const RANKS = [
  "recruit",
  "soldier",
  "veteran",
  "elite",
  "titan",
  "legend",
] as const;
export type Rank = (typeof RANKS)[number];

/** Each rank has three sub-levels (I, II, III). */
export const SUBLEVELS_PER_RANK = 3;

/**
 * Total points needed for each of the 18 levels (Recruit I → Legend III).
 * Early levels come fast so levelling up is felt often; Legend III takes a
 * couple of years of steady training (~50–70 points a week plus medals).
 */
export const LEVEL_THRESHOLDS = [
  0, 50, 120, 220, 350, 520, 750, 1000, 1300, 1650, 2050, 2500, 3000, 3600,
  4300, 5100, 6200, 8000,
] as const;

export const LevelSchema = z.object({
  /** 0-based, 0 = Recruit I … 17 = Legend III. */
  index: z.number().int(),
  rank: z.enum(RANKS),
  /** 1, 2 or 3 (shown as I, II, III). */
  sublevel: z.number().int().min(1).max(SUBLEVELS_PER_RANK),
  minPoints: z.number().int(),
  /** Points needed for the next level; null at the top. */
  nextMinPoints: z.number().int().nullable(),
});
export type Level = z.infer<typeof LevelSchema>;

export function levelForPoints(points: number): Level {
  let index = 0;
  LEVEL_THRESHOLDS.forEach((threshold, i) => {
    if (points >= threshold) index = i;
  });
  return {
    index,
    rank: RANKS[Math.floor(index / SUBLEVELS_PER_RANK)]!,
    sublevel: (index % SUBLEVELS_PER_RANK) + 1,
    minPoints: LEVEL_THRESHOLDS[index]!,
    nextMinPoints: LEVEL_THRESHOLDS[index + 1] ?? null,
  };
}
