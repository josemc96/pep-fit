import { z } from "zod";

import {
  DEFAULT_LOCALE,
  EquipmentSchema,
  ExerciseCategorySchema,
  LocaleSchema,
  MuscleGroupSchema,
} from "./enums.js";

export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  primaryMuscle: MuscleGroupSchema,
  secondaryMuscles: z.array(MuscleGroupSchema),
  equipment: EquipmentSchema.nullable(),
  category: ExerciseCategorySchema,
  imageUrls: z.array(z.string().url()),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

export const ExerciseLocaleQuerySchema = z.object({
  lang: LocaleSchema.default(DEFAULT_LOCALE),
});
export type ExerciseLocaleQuery = z.infer<typeof ExerciseLocaleQuerySchema>;

export const ExerciseFilterQuerySchema = ExerciseLocaleQuerySchema.extend({
  /** Case-insensitive match on the name in the requested `lang`. */
  search: z.string().trim().min(1).max(60).optional(),
  muscle: MuscleGroupSchema.optional(),
  equipment: EquipmentSchema.optional(),
  requiresWeight: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ExerciseFilterQuery = z.infer<typeof ExerciseFilterQuerySchema>;

export const ExercisePageSchema = z.object({
  items: z.array(ExerciseSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
export type ExercisePage = z.infer<typeof ExercisePageSchema>;
