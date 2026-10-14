import { z } from "zod";

import { WorkoutSummarySchema } from "./workout.js";

/** Points per event. Kept deliberately low; see the gamification design. */
export const POINTS = {
  workout: 5,
  personalRecord: 10,
  weekCompleted: 20,
  extraDay: 5,
  fourWeekStreak: 50,
} as const;

/** Extra days (beyond the weekly goal) that earn points, per week. */
export const MAX_REWARDED_EXTRA_DAYS = 2;
/** Every this many consecutive completed weeks earns the streak bonus. */
export const STREAK_BONUS_EVERY_WEEKS = 4;

export const WEEKLY_GOAL_LIMITS = { min: 1, max: 7 } as const;
/** Used until the user sets a goal. */
export const DEFAULT_WEEKLY_GOAL = 3;

export const WeeklyGoalInputSchema = z.object({
  daysPerWeek: z
    .number()
    .int()
    .min(WEEKLY_GOAL_LIMITS.min)
    .max(WEEKLY_GOAL_LIMITS.max),
});
export type WeeklyGoalInput = z.infer<typeof WeeklyGoalInputSchema>;

/**
 * - `weight`: heaviest weight ever lifted for the exercise (any reps).
 * - `reps_at_weight`: more reps than ever with a weight used before.
 * - `bodyweight_reps`: more reps than ever in a bodyweight set.
 */
export const RecordKindSchema = z.enum([
  "weight",
  "reps_at_weight",
  "bodyweight_reps",
]);
export type RecordKind = z.infer<typeof RecordKindSchema>;

export const PersonalRecordSchema = z.object({
  workoutId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  exerciseName: z.string(),
  kind: RecordKindSchema,
  achievedAt: z.coerce.date(),
  reps: z.number().int(),
  weightKg: z.number().nullable(),
  /** The best before this record, for "105 kg (was 100 kg)". */
  previous: z.object({
    reps: z.number().int(),
    weightKg: z.number().nullable(),
  }),
});
export type PersonalRecord = z.infer<typeof PersonalRecordSchema>;

export const PointEventTypeSchema = z.enum([
  "workout",
  "personal_record",
  "week_completed",
  "extra_day",
  "four_week_streak",
]);
export type PointEventType = z.infer<typeof PointEventTypeSchema>;

/** Every point is earned by (and dated at) one workout. */
export const PointEventSchema = z.object({
  type: PointEventTypeSchema,
  points: z.number().int(),
  workoutId: z.string().uuid(),
  record: PersonalRecordSchema.optional(),
  /** For `four_week_streak`: the streak length that earned it. */
  streakWeeks: z.number().int().optional(),
});
export type PointEvent = z.infer<typeof PointEventSchema>;

/** What a just-saved workout earned (POST /workouts response). */
export const WorkoutSavedSchema = WorkoutSummarySchema.extend({
  progress: z.object({
    pointsEarned: z.number().int(),
    events: z.array(PointEventSchema),
  }),
});
export type WorkoutSaved = z.infer<typeof WorkoutSavedSchema>;

const PeriodScoreSchema = z.object({
  /** "YYYY-MM-DD" (a Monday) for weeks, "YYYY-MM" for months. */
  period: z.string(),
  points: z.number().int(),
});

export const ProgressSchema = z.object({
  totalPoints: z.number().int(),
  thisWeek: z.object({
    weekStart: z.string(),
    points: z.number().int(),
    daysTrained: z.number().int(),
    goal: z.number().int(),
  }),
  thisMonth: PeriodScoreSchema,
  bestWeek: PeriodScoreSchema.nullable(),
  bestMonth: PeriodScoreSchema.nullable(),
  streak: z.object({
    /** Consecutive completed weeks up to now (this week counts once done). */
    current: z.number().int(),
    best: z.number().int(),
  }),
  weeklyGoal: z.object({
    current: z.number().int(),
    /** A change waiting for next Monday, if any. */
    next: z
      .object({ daysPerWeek: z.number().int(), effectiveFrom: z.string() })
      .nullable(),
  }),
  recentRecords: z.array(PersonalRecordSchema),
});
export type Progress = z.infer<typeof ProgressSchema>;
