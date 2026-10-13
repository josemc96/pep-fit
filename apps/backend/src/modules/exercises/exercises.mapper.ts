import type { Exercise, Locale, Prisma } from "@pep-fit/db";

/** API exercises carry the name in the requested locale, not the canonical one. */
export function withLocalizedName(
  exercise: Exercise,
  localizedName: string | undefined,
) {
  return { ...exercise, name: localizedName ?? exercise.name };
}

/** Prisma `include` that loads just the translation for `locale`. */
export function localizedExerciseInclude(locale: Locale) {
  return {
    translations: { where: { locale }, select: { name: true } },
  } satisfies Prisma.ExerciseInclude;
}

export function toLocalizedExercise({
  translations,
  ...exercise
}: Exercise & { translations: { name: string }[] }) {
  return withLocalizedName(exercise, translations[0]?.name);
}
