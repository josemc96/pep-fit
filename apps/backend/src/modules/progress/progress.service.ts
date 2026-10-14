import type { Locale, PrismaClient } from "@pep-fit/db";
import {
  levelForPoints,
  type PersonalRecord,
  type PointEvent,
  type Progress,
  type WorkoutSaved,
} from "@pep-fit/shared-types";
import type { FastifyRequest } from "fastify";

import {
  addDays,
  isValidTimeZone,
  localDayKey,
  weekStartOf,
  type DayKey,
} from "./calendar.js";
import {
  computeProgress,
  type EngineRecord,
  type EngineResult,
} from "./engine.js";

const RECENT_RECORDS = 10;

/**
 * The time zone weeks are judged in, sent by the app on every request.
 * Falls back to UTC for clients that don't send it.
 */
export function requestTimeZone(request: FastifyRequest): string {
  const header = request.headers["x-timezone"];
  const timeZone = Array.isArray(header) ? header[0] : header;
  return timeZone && isValidTimeZone(timeZone) ? timeZone : "UTC";
}

const toDayKey = (date: Date): DayKey => date.toISOString().slice(0, 10);
const fromDayKey = (day: DayKey) => new Date(`${day}T00:00:00.000Z`);

export function createProgressService(prisma: PrismaClient) {
  async function run(userId: string, timeZone: string, now: Date) {
    const [workouts, goals] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { userId },
        select: {
          id: true,
          startedAt: true,
          finishedAt: true,
          exercises: {
            orderBy: { position: "asc" },
            select: {
              exerciseId: true,
              exercise: { select: { name: true, primaryMuscle: true } },
              sets: {
                orderBy: { position: "asc" },
                select: { reps: true, weightKg: true },
              },
            },
          },
        },
      }),
      prisma.weeklyGoal.findMany({
        where: { userId },
        select: { daysPerWeek: true, effectiveFrom: true },
      }),
    ]);

    const goalChanges = goals.map((goal) => ({
      daysPerWeek: goal.daysPerWeek,
      effectiveFrom: toDayKey(goal.effectiveFrom),
    }));
    return {
      goals: goalChanges,
      result: computeProgress({
        workouts: workouts.map((workout) => ({
          ...workout,
          exercises: workout.exercises.map(({ exercise, ...rest }) => ({
            ...rest,
            ...exercise,
          })),
        })),
        goals: goalChanges,
        timeZone,
        now,
      }),
    };
  }

  /** Adds localized exercise names to engine records. */
  async function nameRecords(
    records: EngineRecord[],
    locale: Locale,
  ): Promise<PersonalRecord[]> {
    const ids = [...new Set(records.map((record) => record.exerciseId))];
    if (ids.length === 0) return [];

    const translations = await prisma.exerciseTranslation.findMany({
      where: { exerciseId: { in: ids }, locale },
      select: { exerciseId: true, name: true },
    });
    const names = new Map(translations.map((t) => [t.exerciseId, t.name]));
    return records.map((record) => ({
      ...record,
      exerciseName: names.get(record.exerciseId) ?? "",
    }));
  }

  async function eventsWithNames(
    events: EngineResult["events"],
    locale: Locale,
  ): Promise<PointEvent[]> {
    const named = await nameRecords(
      events.flatMap((event) => (event.record ? [event.record] : [])),
      locale,
    );
    let index = 0;
    return events.map(({ day: _day, record, ...event }) =>
      record ? { ...event, record: named[index++] } : event,
    );
  }

  return {
    async get(
      userId: string,
      timeZone: string,
      locale: Locale,
      now = new Date(),
    ): Promise<Progress> {
      const { goals, result } = await run(userId, timeZone, now);
      const nextWeek = addDays(result.thisWeek.weekStart, 7);
      const pending = goals.find((goal) => goal.effectiveFrom === nextWeek);

      const { events: _events, records, ...scores } = result;
      return {
        ...scores,
        level: levelForPoints(result.totalPoints),
        weeklyGoal: {
          current: result.thisWeek.goal,
          next:
            pending && pending.daysPerWeek !== result.thisWeek.goal
              ? pending
              : null,
        },
        recentRecords: await nameRecords(
          records.slice(-RECENT_RECORDS).reverse(),
          locale,
        ),
      };
    },

    /** What one workout earned, e.g. for the summary right after saving it. */
    async forWorkout(
      userId: string,
      workoutId: string,
      timeZone: string,
      locale: Locale,
    ): Promise<WorkoutSaved["progress"]> {
      const { result } = await run(userId, timeZone, new Date());
      const events = await eventsWithNames(
        result.events.filter((event) => event.workoutId === workoutId),
        locale,
      );
      const pointsEarned = events.reduce((sum, event) => sum + event.points, 0);

      // The workout just saved is normally the latest, so the level before it
      // is the level without its points.
      const before = levelForPoints(result.totalPoints - pointsEarned);
      const after = levelForPoints(result.totalPoints);
      return {
        pointsEarned,
        events,
        levelUp:
          after.index > before.index ? { from: before, to: after } : null,
      };
    },

    /**
     * The first goal applies from this week; later changes from next Monday,
     * so a goal can't be lowered on a Sunday to rescue the current week.
     */
    async setWeeklyGoal(
      userId: string,
      daysPerWeek: number,
      timeZone: string,
      now = new Date(),
    ) {
      const thisWeek = weekStartOf(localDayKey(now, timeZone));
      const hasGoal =
        (await prisma.weeklyGoal.count({ where: { userId } })) > 0;
      const effectiveFrom = fromDayKey(
        hasGoal ? addDays(thisWeek, 7) : thisWeek,
      );

      await prisma.weeklyGoal.upsert({
        where: { userId_effectiveFrom: { userId, effectiveFrom } },
        create: { userId, daysPerWeek, effectiveFrom },
        update: { daysPerWeek },
      });
    },
  };
}
