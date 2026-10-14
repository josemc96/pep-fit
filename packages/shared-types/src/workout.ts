import { z } from "zod";

import { ExerciseSchema } from "./exercise.js";
import { ROUTINE_LIMITS } from "./routine.js";

export const WORKOUT_LIMITS = {
  maxExercises: 30,
  maxSetsPerExercise: 30,
  maxReps: ROUTINE_LIMITS.maxReps,
  maxWeightKg: ROUTINE_LIMITS.maxWeightKg,
  maxDurationHours: 12,
} as const;

export const WorkoutSetInputSchema = z.object({
  reps: z.number().int().min(1).max(WORKOUT_LIMITS.maxReps),
  /** Null for bodyweight sets. */
  weightKg: z.number().min(0).max(WORKOUT_LIMITS.maxWeightKg).nullable(),
});
export type WorkoutSetInput = z.infer<typeof WorkoutSetInputSchema>;

export const WorkoutExerciseInputSchema = z.object({
  exerciseId: z.string().uuid(),
  sets: z
    .array(WorkoutSetInputSchema)
    .min(1)
    .max(WORKOUT_LIMITS.maxSetsPerExercise),
});
export type WorkoutExerciseInput = z.infer<typeof WorkoutExerciseInputSchema>;

/**
 * A finished workout, sent once at the end (the in-progress workout lives on
 * the device so it works without signal). Only completed sets are included.
 */
export const WorkoutInputSchema = z
  .object({
    routineId: z.string().uuid().nullable(),
    routineDayIndex: z.number().int().min(0).nullable(),
    startedAt: z.coerce.date(),
    finishedAt: z.coerce.date(),
    exercises: z
      .array(WorkoutExerciseInputSchema)
      .min(1)
      .max(WORKOUT_LIMITS.maxExercises),
  })
  .refine((workout) => workout.finishedAt >= workout.startedAt, {
    message: "finishedAt must not be before startedAt",
    path: ["finishedAt"],
  })
  .refine(
    (workout) =>
      workout.finishedAt.getTime() - workout.startedAt.getTime() <=
      WORKOUT_LIMITS.maxDurationHours * 3_600_000,
    { message: "Workout is too long", path: ["finishedAt"] },
  );
export type WorkoutInput = z.input<typeof WorkoutInputSchema>;

export const WorkoutSummarySchema = z.object({
  id: z.string().uuid(),
  routineId: z.string().uuid().nullable(),
  routineName: z.string().nullable(),
  routineDayIndex: z.number().int().nullable(),
  dayName: z.string().nullable(),
  startedAt: z.coerce.date(),
  finishedAt: z.coerce.date(),
  exerciseCount: z.number().int(),
  setCount: z.number().int(),
  /** Sum of reps × kg over all sets (bodyweight sets count as 0). */
  volumeKg: z.number(),
});
export type WorkoutSummary = z.infer<typeof WorkoutSummarySchema>;

export const WorkoutSetSchema = WorkoutSetInputSchema;
export type WorkoutSet = z.infer<typeof WorkoutSetSchema>;

export const WorkoutDetailSchema = WorkoutSummarySchema.extend({
  exercises: z.array(
    z.object({
      id: z.string().uuid(),
      exercise: ExerciseSchema,
      sets: z.array(WorkoutSetSchema),
    }),
  ),
});
export type WorkoutDetail = z.infer<typeof WorkoutDetailSchema>;

export const WorkoutListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

export const WorkoutPageSchema = z.object({
  items: z.array(WorkoutSummarySchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
export type WorkoutPage = z.infer<typeof WorkoutPageSchema>;

/** `?exerciseIds=a,b,c` — what the user did last time for each exercise. */
export const PreviousSetsQuerySchema = z.object({
  exerciseIds: z
    .string()
    .transform((value) => value.split(",").filter(Boolean))
    .pipe(z.array(z.string().uuid()).min(1).max(WORKOUT_LIMITS.maxExercises)),
});

export const PreviousSetsResponseSchema = z.object({
  /** One entry per exercise that has been trained before. */
  items: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      performedAt: z.coerce.date(),
      sets: z.array(WorkoutSetSchema),
    }),
  ),
});
export type PreviousSets = z.infer<
  typeof PreviousSetsResponseSchema
>["items"][number];

export function workoutVolumeKg(sets: WorkoutSet[]): number {
  return sets.reduce((sum, set) => sum + set.reps * (set.weightKg ?? 0), 0);
}

export const LatestWorkoutQuerySchema = z.object({
  routineId: z.string().uuid().optional(),
});

/** GET /workouts/latest; `workout` is null when there is none yet. */
export const LatestWorkoutResponseSchema = z.object({
  workout: WorkoutSummarySchema.nullable(),
});

/**
 * Day to suggest next: the one after the last trained day of this routine,
 * wrapping around; the first day if the routine was never trained.
 */
export function nextRoutineDayIndex(
  lastDayIndex: number | null | undefined,
  dayCount: number,
): number {
  if (dayCount <= 0) return 0;
  if (lastDayIndex === null || lastDayIndex === undefined) return 0;
  return (lastDayIndex + 1) % dayCount;
}
