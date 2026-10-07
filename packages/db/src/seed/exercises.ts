import { readFileSync } from "node:fs";

import type {
  Equipment,
  ExerciseCategory,
  Locale,
  MuscleGroup,
} from "@prisma/client";

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

/** Maps each canonical English exercise name to its translation. */
function loadNameTranslations(locale: Locale): Record<string, string> {
  const file = new URL(`./data/exercise-names.${locale}.json`, import.meta.url);
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, string>;
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

  const spanishNames = loadNameTranslations("es");
  const untranslated = exercises
    .map((exercise) => exercise.name)
    .filter((name) => !spanishNames[name]);
  if (untranslated.length > 0) {
    console.warn(
      `${untranslated.length} exercises have no Spanish name and will fall back to English:\n  ${untranslated.join("\n  ")}`,
    );
  }

  const inserted = await prisma.exercise.findMany({
    select: { id: true, name: true },
  });
  const translations = inserted.flatMap(({ id, name }) => [
    { exerciseId: id, locale: "en" as const, name },
    { exerciseId: id, locale: "es" as const, name: spanishNames[name] ?? name },
  ]);

  console.log(`Inserting ${translations.length} exercise name translations...`);
  await prisma.exerciseTranslation.createMany({ data: translations });

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
