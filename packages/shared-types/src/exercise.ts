import { z } from "zod";

import {
  EquipmentSchema,
  ExerciseCategorySchema,
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

export const ExerciseFilterQuerySchema = z.object({
  muscle: MuscleGroupSchema.optional(),
  equipment: EquipmentSchema.optional(),
  requiresWeight: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type ExerciseFilterQuery = z.infer<typeof ExerciseFilterQuerySchema>;
