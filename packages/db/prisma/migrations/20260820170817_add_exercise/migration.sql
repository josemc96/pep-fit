-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest', 'forearms', 'glutes', 'hamstrings', 'lats', 'lower_back', 'middle_back', 'neck', 'quadriceps', 'shoulders', 'traps', 'triceps');

-- CreateEnum
CREATE TYPE "Equipment" AS ENUM ('barbell', 'dumbbell', 'kettlebells', 'machine', 'cable', 'body_only', 'bands', 'medicine_ball', 'exercise_ball', 'foam_roll', 'e_z_curl_bar', 'other');

-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('strength', 'stretching', 'plyometrics', 'strongman', 'powerlifting', 'cardio', 'olympic_weightlifting');

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryMuscle" "MuscleGroup" NOT NULL,
    "secondaryMuscles" "MuscleGroup"[],
    "equipment" "Equipment",
    "category" "ExerciseCategory" NOT NULL,
    "imageUrls" TEXT[],

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);
