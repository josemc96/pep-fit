import { z } from "zod";

import { ExerciseSchema } from "./exercise.js";

export const TemplateLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "all",
]);
export type TemplateLevel = z.infer<typeof TemplateLevelSchema>;

export const TemplateEquipmentSchema = z.enum([
  "gym",
  "dumbbells",
  "bodyweight",
]);
export type TemplateEquipment = z.infer<typeof TemplateEquipmentSchema>;

/** A catalog routine as listed (names already in the requested language). */
export const RoutineTemplateSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  level: TemplateLevelSchema,
  equipment: TemplateEquipmentSchema,
  /** Recommended training days per week (can differ from dayCount, e.g. A/B). */
  daysPerWeek: z.number().int(),
  dayCount: z.number().int(),
  exerciseCount: z.number().int(),
});
export type RoutineTemplateSummary = z.infer<
  typeof RoutineTemplateSummarySchema
>;

export const RoutineTemplateDetailSchema = RoutineTemplateSummarySchema.extend({
  days: z.array(
    z.object({
      name: z.string(),
      exercises: z.array(
        z.object({
          exercise: ExerciseSchema,
          restSeconds: z.number().int(),
          sets: z.number().int(),
          reps: z.number().int(),
        }),
      ),
    }),
  ),
});
export type RoutineTemplateDetail = z.infer<typeof RoutineTemplateDetailSchema>;

export const CopyTemplateInputSchema = z.object({
  /** Also make the copy the routine being followed. */
  activate: z.boolean().default(true),
});
export type CopyTemplateInput = z.input<typeof CopyTemplateInputSchema>;
