import { readFileSync } from "node:fs";

import { normalizeForSearch } from "@pep-fit/shared-types";
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

const UPSERT_BATCH_SIZE = 50;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
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

  const spanishNames = loadNameTranslations("es");
  const untranslated = exercises
    .map((exercise) => exercise.name)
    .filter((name) => !spanishNames[name]);
  if (untranslated.length > 0) {
    console.warn(
      `${untranslated.length} exercises have no Spanish name and will fall back to English:\n  ${untranslated.join("\n  ")}`,
    );
  }

  // Upsert (never delete): user routines reference exercises by id, so the
  // seed must be safely re-runnable against a database with real data.
  console.log(`Upserting ${exercises.length} exercises and their names...`);
  for (const batch of chunk(exercises, UPSERT_BATCH_SIZE)) {
    await prisma.$transaction(async (tx) => {
      for (const exercise of batch) {
        const { id: exerciseId } = await tx.exercise.upsert({
          where: { name: exercise.name },
          create: exercise,
          update: exercise,
          select: { id: true },
        });

        const names: Record<Locale, string> = {
          en: exercise.name,
          es: spanishNames[exercise.name] ?? exercise.name,
        };
        for (const [locale, name] of Object.entries(names) as [
          Locale,
          string,
        ][]) {
          const searchName = normalizeForSearch(name);
          await tx.exerciseTranslation.upsert({
            where: { exerciseId_locale: { exerciseId, locale } },
            create: { exerciseId, locale, name, searchName },
            update: { name, searchName },
          });
        }
      }
    });
  }

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
