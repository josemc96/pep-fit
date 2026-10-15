import type { Locale, PrismaClient } from "@pep-fit/db";
import type {
  Exercise,
  RoutineInput,
  RoutineTemplateDetail,
  RoutineTemplateSummary,
} from "@pep-fit/shared-types";

import {
  localizedExerciseInclude,
  toLocalizedExercise,
} from "../exercises/exercises.mapper.js";
import {
  ROUTINE_TEMPLATES,
  type TemplateDefinition,
} from "./templates.data.js";

/** The catalog references an exercise the database doesn't have (unseeded DB). */
export class TemplateUnavailableError extends Error {
  readonly statusCode = 503;
  override readonly name = "TemplateUnavailable";
}

function toSummary(
  template: TemplateDefinition,
  locale: Locale,
): RoutineTemplateSummary {
  return {
    id: template.id,
    name: template.name[locale],
    description: template.description[locale],
    level: template.level,
    equipment: template.equipment,
    daysPerWeek: template.daysPerWeek,
    dayCount: template.days.length,
    exerciseCount: template.days.reduce(
      (sum, d) => sum + d.exercises.length,
      0,
    ),
  };
}

export function createTemplatesService(prisma: PrismaClient) {
  /** The template's exercises, localized, keyed by canonical name. */
  async function exercisesOf(
    template: TemplateDefinition,
    locale: Locale,
  ): Promise<Map<string, Exercise>> {
    const names = [
      ...new Set(
        template.days.flatMap((d) => d.exercises.map((e) => e.exercise)),
      ),
    ];
    const rows = await prisma.exercise.findMany({
      where: { name: { in: names } },
      include: localizedExerciseInclude(locale),
    });
    const byName = new Map(
      rows.map((row) => [row.name, toLocalizedExercise(row)]),
    );
    const missing = names.filter((name) => !byName.has(name));
    if (missing.length > 0) {
      throw new TemplateUnavailableError(
        `Exercises not found: ${missing.join(", ")}`,
      );
    }
    return byName;
  }

  const find = (id: string) => ROUTINE_TEMPLATES.find((t) => t.id === id);

  return {
    list(locale: Locale): RoutineTemplateSummary[] {
      return ROUTINE_TEMPLATES.map((template) => toSummary(template, locale));
    },

    /** Returns null for an unknown template id. */
    async get(
      id: string,
      locale: Locale,
    ): Promise<RoutineTemplateDetail | null> {
      const template = find(id);
      if (!template) return null;

      const exercises = await exercisesOf(template, locale);
      return {
        ...toSummary(template, locale),
        days: template.days.map((d) => ({
          name: d.name[locale],
          exercises: d.exercises.map((e) => ({
            exercise: exercises.get(e.exercise)!,
            restSeconds: e.restSeconds,
            sets: e.sets,
            reps: e.reps,
          })),
        })),
      };
    },

    /**
     * The template as routine content, in the user's language, ready to be
     * copied into their own routines. Null for an unknown template id.
     */
    async toRoutineInput(
      id: string,
      locale: Locale,
    ): Promise<RoutineInput | null> {
      const template = find(id);
      if (!template) return null;

      const exercises = await exercisesOf(template, locale);
      return {
        name: template.name[locale],
        days: template.days.map((d) => ({
          name: d.name[locale],
          exercises: d.exercises.map((e) => ({
            exerciseId: exercises.get(e.exercise)!.id,
            restSeconds: e.restSeconds,
            sets: Array.from({ length: e.sets }, () => ({
              targetReps: e.reps,
              targetWeightKg: null,
            })),
          })),
        })),
      };
    },
  };
}
