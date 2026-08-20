import { z } from "zod";

export const MuscleGroupSchema = z.enum([
  "abdominals",
  "abductors",
  "adductors",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower_back",
  "middle_back",
  "neck",
  "quadriceps",
  "shoulders",
  "traps",
  "triceps",
]);
export type MuscleGroup = z.infer<typeof MuscleGroupSchema>;

export const EquipmentSchema = z.enum([
  "barbell",
  "dumbbell",
  "kettlebells",
  "machine",
  "cable",
  "body_only",
  "bands",
  "medicine_ball",
  "exercise_ball",
  "foam_roll",
  "e_z_curl_bar",
  "other",
]);
export type Equipment = z.infer<typeof EquipmentSchema>;

export const ExerciseCategorySchema = z.enum([
  "strength",
  "stretching",
  "plyometrics",
  "strongman",
  "powerlifting",
  "cardio",
  "olympic_weightlifting",
]);
export type ExerciseCategory = z.infer<typeof ExerciseCategorySchema>;

export const ExperienceLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

export const GoalSchema = z.enum([
  "build_muscle",
  "lose_weight",
  "maintenance",
  "strength",
]);
export type Goal = z.infer<typeof GoalSchema>;

export const WeekDaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export type WeekDay = z.infer<typeof WeekDaySchema>;
