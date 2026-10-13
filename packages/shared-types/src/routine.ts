import { z } from "zod";

import { ExerciseSchema } from "./exercise.js";

export const ROUTINE_LIMITS = {
  nameMaxLength: 60,
  maxDays: 7,
  maxExercisesPerDay: 20,
  maxSetsPerExercise: 20,
  maxReps: 100,
  maxWeightKg: 1000,
  maxRestSeconds: 900,
} as const;

export const DEFAULT_REST_SECONDS = 90;

const nameSchema = z.string().trim().min(1).max(ROUTINE_LIMITS.nameMaxLength);

export const RoutineSetInputSchema = z.object({
  targetReps: z.number().int().min(1).max(ROUTINE_LIMITS.maxReps).nullable(),
  targetWeightKg: z.number().min(0).max(ROUTINE_LIMITS.maxWeightKg).nullable(),
});
export type RoutineSetInput = z.infer<typeof RoutineSetInputSchema>;

export const RoutineExerciseInputSchema = z.object({
  exerciseId: z.string().uuid(),
  restSeconds: z.number().int().min(0).max(ROUTINE_LIMITS.maxRestSeconds),
  sets: z
    .array(RoutineSetInputSchema)
    .min(1)
    .max(ROUTINE_LIMITS.maxSetsPerExercise),
});
export type RoutineExerciseInput = z.infer<typeof RoutineExerciseInputSchema>;

export const RoutineDayInputSchema = z.object({
  name: nameSchema,
  exercises: z
    .array(RoutineExerciseInputSchema)
    .max(ROUTINE_LIMITS.maxExercisesPerDay),
});
export type RoutineDayInput = z.infer<typeof RoutineDayInputSchema>;

/**
 * Body for creating or fully replacing a routine. Array order is the display
 * order, so positions never travel over the wire.
 */
export const RoutineInputSchema = z.object({
  name: nameSchema,
  days: z.array(RoutineDayInputSchema).min(1).max(ROUTINE_LIMITS.maxDays),
});
export type RoutineInput = z.infer<typeof RoutineInputSchema>;

export const RoutineSetSchema = RoutineSetInputSchema.extend({
  id: z.string().uuid(),
});
export type RoutineSet = z.infer<typeof RoutineSetSchema>;

export const RoutineExerciseSchema = RoutineExerciseInputSchema.extend({
  id: z.string().uuid(),
  exercise: ExerciseSchema,
  sets: z.array(RoutineSetSchema),
});
export type RoutineExercise = z.infer<typeof RoutineExerciseSchema>;

export const RoutineDaySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  exercises: z.array(RoutineExerciseSchema),
});
export type RoutineDay = z.infer<typeof RoutineDaySchema>;

export const RoutineSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  days: z.array(RoutineDaySchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Routine = z.infer<typeof RoutineSchema>;

export const RoutineSummarySchema = RoutineSchema.pick({
  id: true,
  name: true,
  isActive: true,
  updatedAt: true,
}).extend({
  dayCount: z.number().int(),
});
export type RoutineSummary = z.infer<typeof RoutineSummarySchema>;
