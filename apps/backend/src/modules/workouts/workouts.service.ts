import type { Locale, Prisma, PrismaClient } from "@pep-fit/db";
import {
  workoutVolumeKg,
  type PreviousSets,
  type WorkoutDetail,
  type WorkoutInputSchema,
  type WorkoutPage,
  type WorkoutSummary,
} from "@pep-fit/shared-types";
import type { z } from "zod";

import { assertExercisesExist } from "../exercises/exercises.guards.js";
import {
  localizedExerciseInclude,
  toLocalizedExercise,
} from "../exercises/exercises.mapper.js";

type WorkoutInput = z.output<typeof WorkoutInputSchema>;

const setSelect = {
  reps: true,
  weightKg: true,
} satisfies Prisma.WorkoutSetSelect;

const summaryInclude = {
  exercises: { select: { sets: { select: setSelect } } },
} satisfies Prisma.WorkoutSessionInclude;

function detailInclude(locale: Locale) {
  return {
    exercises: {
      orderBy: { position: "asc" },
      include: {
        exercise: { include: localizedExerciseInclude(locale) },
        sets: { orderBy: { position: "asc" }, select: setSelect },
      },
    },
  } satisfies Prisma.WorkoutSessionInclude;
}

type SessionWithCounts = Prisma.WorkoutSessionGetPayload<{
  include: typeof summaryInclude;
}>;

function toSummary(session: SessionWithCounts): WorkoutSummary {
  const sets = session.exercises.flatMap((exercise) => exercise.sets);
  return {
    id: session.id,
    routineId: session.routineId,
    routineName: session.routineName,
    routineDayIndex: session.routineDayIndex,
    dayName: session.dayName,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    exerciseCount: session.exercises.length,
    setCount: sets.length,
    volumeKg: workoutVolumeKg(sets),
  };
}

export function createWorkoutsService(prisma: PrismaClient) {
  return {
    /**
     * Stores a finished workout. Routine and day names are snapshotted from
     * the routine as it is now; a routine that isn't the user's is ignored
     * rather than rejected, so a workout is never lost over it.
     */
    async create(userId: string, input: WorkoutInput): Promise<WorkoutSummary> {
      await assertExercisesExist(
        prisma,
        input.exercises.map((exercise) => exercise.exerciseId),
      );

      const routine = input.routineId
        ? await prisma.routine.findFirst({
            where: { id: input.routineId, userId },
            select: {
              id: true,
              name: true,
              days: { select: { position: true, name: true } },
            },
          })
        : null;
      const day =
        routine && input.routineDayIndex !== null
          ? routine.days.find((d) => d.position === input.routineDayIndex)
          : undefined;

      const session = await prisma.workoutSession.create({
        data: {
          userId,
          routineId: routine?.id ?? null,
          routineName: routine?.name ?? null,
          routineDayIndex: day ? day.position : null,
          dayName: day?.name ?? null,
          startedAt: input.startedAt,
          finishedAt: input.finishedAt,
          exercises: {
            create: input.exercises.map((exercise, exercisePosition) => ({
              position: exercisePosition,
              exercise: { connect: { id: exercise.exerciseId } },
              sets: {
                create: exercise.sets.map((set, setPosition) => ({
                  position: setPosition,
                  reps: set.reps,
                  weightKg: set.weightKg,
                })),
              },
            })),
          },
        },
        include: summaryInclude,
      });

      return toSummary(session);
    },

    /** Most recent workout, optionally limited to one routine. */
    async latest(
      userId: string,
      routineId?: string,
    ): Promise<WorkoutSummary | null> {
      const session = await prisma.workoutSession.findFirst({
        where: { userId, ...(routineId ? { routineId } : {}) },
        orderBy: { finishedAt: "desc" },
        include: summaryInclude,
      });
      return session ? toSummary(session) : null;
    },

    /** History, newest first. */
    async list(
      userId: string,
      page: number,
      pageSize: number,
    ): Promise<WorkoutPage> {
      const [sessions, total] = await Promise.all([
        prisma.workoutSession.findMany({
          where: { userId },
          orderBy: [{ finishedAt: "desc" }, { id: "asc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: summaryInclude,
        }),
        prisma.workoutSession.count({ where: { userId } }),
      ]);
      return { items: sessions.map(toSummary), page, pageSize, total };
    },

    /** Returns null when the workout doesn't exist or isn't the user's. */
    async get(
      userId: string,
      workoutId: string,
      locale: Locale,
    ): Promise<WorkoutDetail | null> {
      const session = await prisma.workoutSession.findFirst({
        where: { id: workoutId, userId },
        include: detailInclude(locale),
      });
      if (!session) return null;

      return {
        ...toSummary(session),
        exercises: session.exercises.map((workoutExercise) => ({
          id: workoutExercise.id,
          exercise: toLocalizedExercise(workoutExercise.exercise),
          sets: workoutExercise.sets,
        })),
      };
    },

    /** Returns false when the workout doesn't exist or isn't the user's. */
    async remove(userId: string, workoutId: string): Promise<boolean> {
      const { count } = await prisma.workoutSession.deleteMany({
        where: { id: workoutId, userId },
      });
      return count > 0;
    },

    /** For each exercise, the sets from the last workout that included it. */
    async previousSets(
      userId: string,
      exerciseIds: string[],
    ): Promise<PreviousSets[]> {
      const latest = await Promise.all(
        [...new Set(exerciseIds)].map((exerciseId) =>
          prisma.workoutExercise.findFirst({
            where: { exerciseId, session: { userId } },
            orderBy: { session: { finishedAt: "desc" } },
            select: {
              exerciseId: true,
              session: { select: { finishedAt: true } },
              sets: { orderBy: { position: "asc" }, select: setSelect },
            },
          }),
        ),
      );

      return latest
        .filter((item) => item !== null)
        .map((item) => ({
          exerciseId: item.exerciseId,
          performedAt: item.session.finishedAt,
          sets: item.sets,
        }));
    },
  };
}
