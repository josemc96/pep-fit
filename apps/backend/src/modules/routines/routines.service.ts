import type { Locale, Prisma, PrismaClient } from "@pep-fit/db";
import type {
  Routine,
  RoutineInput,
  RoutineSummary,
} from "@pep-fit/shared-types";

import { assertExercisesExist } from "../exercises/exercises.guards.js";
import {
  localizedExerciseInclude,
  toLocalizedExercise,
} from "../exercises/exercises.mapper.js";

function routineInclude(locale: Locale) {
  return {
    days: {
      orderBy: { position: "asc" },
      include: {
        exercises: {
          orderBy: { position: "asc" },
          include: {
            exercise: { include: localizedExerciseInclude(locale) },
            sets: { orderBy: { position: "asc" } },
          },
        },
      },
    },
  } satisfies Prisma.RoutineInclude;
}

type RoutineWithTree = Prisma.RoutineGetPayload<{
  include: ReturnType<typeof routineInclude>;
}>;

function toRoutine(
  routine: RoutineWithTree,
  activeRoutineId: string | null,
): Routine {
  return {
    id: routine.id,
    name: routine.name,
    isActive: routine.id === activeRoutineId,
    sourceTemplateId: routine.sourceTemplateId,
    createdAt: routine.createdAt,
    updatedAt: routine.updatedAt,
    days: routine.days.map((day) => ({
      id: day.id,
      name: day.name,
      exercises: day.exercises.map((routineExercise) => ({
        id: routineExercise.id,
        exerciseId: routineExercise.exerciseId,
        restSeconds: routineExercise.restSeconds,
        exercise: toLocalizedExercise(routineExercise.exercise),
        sets: routineExercise.sets.map((set) => ({
          id: set.id,
          targetReps: set.targetReps,
          targetWeightKg: set.targetWeightKg,
        })),
      })),
    })),
  };
}

/** Nested-create payload for a routine's days; array order becomes position. */
function daysCreateInput(
  days: RoutineInput["days"],
): Prisma.RoutineDayCreateWithoutRoutineInput[] {
  return days.map((day, dayPosition) => ({
    position: dayPosition,
    name: day.name,
    exercises: {
      create: day.exercises.map((exercise, exercisePosition) => ({
        position: exercisePosition,
        restSeconds: exercise.restSeconds,
        exercise: { connect: { id: exercise.exerciseId } },
        sets: {
          create: exercise.sets.map((set, setPosition) => ({
            position: setPosition,
            targetReps: set.targetReps,
            targetWeightKg: set.targetWeightKg,
          })),
        },
      })),
    },
  }));
}

const exerciseIdsOf = (input: RoutineInput) =>
  input.days.flatMap((day) => day.exercises.map((e) => e.exerciseId));

export function createRoutinesService(prisma: PrismaClient) {
  async function activeRoutineIdOf(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { activeRoutineId: true },
    });
    return user.activeRoutineId;
  }

  return {
    async list(userId: string): Promise<RoutineSummary[]> {
      const [routines, activeRoutineId] = await Promise.all([
        prisma.routine.findMany({
          where: { userId },
          orderBy: { updatedAt: "desc" },
          include: { _count: { select: { days: true } } },
        }),
        activeRoutineIdOf(userId),
      ]);

      return routines.map((routine) => ({
        id: routine.id,
        name: routine.name,
        isActive: routine.id === activeRoutineId,
        updatedAt: routine.updatedAt,
        dayCount: routine._count.days,
      }));
    },

    /** Returns null when the routine doesn't exist or isn't the user's. */
    async get(
      userId: string,
      routineId: string,
      locale: Locale,
    ): Promise<Routine | null> {
      const [routine, activeRoutineId] = await Promise.all([
        prisma.routine.findFirst({
          where: { id: routineId, userId },
          include: routineInclude(locale),
        }),
        activeRoutineIdOf(userId),
      ]);
      return routine ? toRoutine(routine, activeRoutineId) : null;
    },

    async create(
      userId: string,
      input: RoutineInput,
      locale: Locale,
    ): Promise<Routine> {
      await assertExercisesExist(prisma, exerciseIdsOf(input));
      const routine = await prisma.routine.create({
        data: {
          userId,
          name: input.name,
          days: { create: daysCreateInput(input.days) },
        },
        include: routineInclude(locale),
      });
      return toRoutine(routine, await activeRoutineIdOf(userId));
    },

    /**
     * Creates an independent copy of some routine content for the user (from
     * a catalog template now; from another user's routine in the social
     * phase). Editing the copy never affects where it came from.
     */
    async copy(
      userId: string,
      input: RoutineInput,
      locale: Locale,
      options: { sourceTemplateId?: string; activate?: boolean } = {},
    ): Promise<Routine> {
      await assertExercisesExist(prisma, exerciseIdsOf(input));
      const routine = await prisma.$transaction(async (tx) => {
        const created = await tx.routine.create({
          data: {
            userId,
            name: input.name,
            sourceTemplateId: options.sourceTemplateId ?? null,
            days: { create: daysCreateInput(input.days) },
          },
          include: routineInclude(locale),
        });
        if (options.activate) {
          await tx.user.update({
            where: { id: userId },
            data: { activeRoutineId: created.id },
          });
        }
        return created;
      });
      return toRoutine(routine, await activeRoutineIdOf(userId));
    },

    /**
     * Replaces the routine's whole tree. Days/exercises/sets get new ids,
     * which is fine: nothing references them by id yet, and logged workouts
     * (next phase) will snapshot what was done rather than point at the plan.
     */
    async replace(
      userId: string,
      routineId: string,
      input: RoutineInput,
      locale: Locale,
    ): Promise<Routine | null> {
      const routine = await prisma.$transaction(async (tx) => {
        const owned = await tx.routine.count({
          where: { id: routineId, userId },
        });
        if (owned === 0) return null;

        await assertExercisesExist(tx, exerciseIdsOf(input));
        await tx.routineDay.deleteMany({ where: { routineId } });
        return tx.routine.update({
          where: { id: routineId },
          data: {
            name: input.name,
            days: { create: daysCreateInput(input.days) },
          },
          include: routineInclude(locale),
        });
      });

      return routine
        ? toRoutine(routine, await activeRoutineIdOf(userId))
        : null;
    },

    /** Returns false when the routine doesn't exist or isn't the user's. */
    async remove(userId: string, routineId: string): Promise<boolean> {
      const { count } = await prisma.routine.deleteMany({
        where: { id: routineId, userId },
      });
      return count > 0;
    },
  };
}
