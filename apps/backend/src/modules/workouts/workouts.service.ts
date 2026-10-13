import type { Prisma, PrismaClient } from "@pep-fit/db";
import type { WorkoutInputSchema, WorkoutSummary } from "@pep-fit/shared-types";
import type { z } from "zod";

import { assertExercisesExist } from "../exercises/exercises.guards.js";

type WorkoutInput = z.output<typeof WorkoutInputSchema>;

const summaryInclude = {
  exercises: { select: { _count: { select: { sets: true } } } },
} satisfies Prisma.WorkoutSessionInclude;

type SessionWithCounts = Prisma.WorkoutSessionGetPayload<{
  include: typeof summaryInclude;
}>;

function toSummary(session: SessionWithCounts): WorkoutSummary {
  return {
    id: session.id,
    routineId: session.routineId,
    routineName: session.routineName,
    routineDayIndex: session.routineDayIndex,
    dayName: session.dayName,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    exerciseCount: session.exercises.length,
    setCount: session.exercises.reduce((sum, e) => sum + e._count.sets, 0),
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
  };
}
