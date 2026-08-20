import type { Equipment, ExerciseCategory, MuscleGroup } from "@prisma/client";

import { prisma } from "../index.js";

const DATASET_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

interface RawExercise {
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  category: string;
  images: string[];
}

function toEnumValue(value: string): string {
  return value.replace(/[\s-]+/g, "_");
}

async function main() {
  console.log(`Fetching exercise dataset from ${DATASET_URL} ...`);
  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch dataset: ${response.status} ${response.statusText}`,
    );
  }
  const raw = (await response.json()) as RawExercise[];

  const exercises = raw.map((exercise) => {
    const primaryMuscleRaw = exercise.primaryMuscles[0];
    if (!primaryMuscleRaw) {
      throw new Error(`Exercise "${exercise.name}" has no primary muscle`);
    }

    return {
      name: exercise.name,
      primaryMuscle: toEnumValue(primaryMuscleRaw) as MuscleGroup,
      secondaryMuscles: exercise.secondaryMuscles.map(
        (muscle) => toEnumValue(muscle) as MuscleGroup,
      ),
      equipment: exercise.equipment
        ? (toEnumValue(exercise.equipment) as Equipment)
        : null,
      category: toEnumValue(exercise.category) as ExerciseCategory,
      imageUrls: exercise.images.map((image) => `${IMAGE_BASE_URL}/${image}`),
    };
  });

  console.log("Clearing existing exercises...");
  await prisma.exercise.deleteMany();

  console.log(`Inserting ${exercises.length} exercises...`);
  await prisma.exercise.createMany({ data: exercises });

  console.log("Done.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
