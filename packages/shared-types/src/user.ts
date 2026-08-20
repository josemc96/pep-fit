import { z } from "zod";

import { ExperienceLevelSchema, GoalSchema } from "./enums.js";

export const UserSchema = z.object({
  id: z.string().uuid(),
  clerkId: z.string(),
  email: z.string().email(),
  alias: z.string().min(2).max(30).nullable(),
  avatarUrl: z.string().url().nullable(),
  targetWeight: z.number().positive().nullable(),
  experienceLevel: ExperienceLevelSchema.nullable(),
  goal: GoalSchema.nullable(),
  onboardingCompleted: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserInputSchema = UserSchema.pick({
  clerkId: true,
  email: true,
}).extend({
  alias: UserSchema.shape.alias.optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdateUserInputSchema = UserSchema.pick({
  alias: true,
  avatarUrl: true,
  targetWeight: true,
  experienceLevel: true,
  goal: true,
}).partial();
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
