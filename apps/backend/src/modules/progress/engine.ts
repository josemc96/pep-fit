import {
  DEFAULT_WEEKLY_GOAL,
  MAX_REWARDED_EXTRA_DAYS,
  POINTS,
  STREAK_BONUS_EVERY_WEEKS,
  type PersonalRecord,
  type PointEvent,
  type Progress,
} from "@pep-fit/shared-types";

import {
  addDays,
  localDayKey,
  monthOf,
  weekStartOf,
  type DayKey,
} from "./calendar.js";

/**
 * Pure progress engine: replays a user's whole workout history in order and
 * derives personal records, completed weeks, streaks and points from it.
 * Nothing it produces is stored, so deleting a workout or tweaking a rule
 * simply changes the result of the next run.
 */

export type EngineSet = { reps: number; weightKg: number | null };

export type EngineWorkout = {
  id: string;
  startedAt: Date;
  exercises: { exerciseId: string; sets: EngineSet[] }[];
};

export type GoalChange = { daysPerWeek: number; effectiveFrom: DayKey };

export type EngineRecord = Omit<PersonalRecord, "exerciseName">;

export type EngineEvent = Omit<PointEvent, "record"> & {
  record?: EngineRecord;
  /** Local day of the workout that earned it. */
  day: DayKey;
};

export type EngineInput = {
  workouts: EngineWorkout[];
  goals: GoalChange[];
  timeZone: string;
  now: Date;
};

export type EngineResult = {
  events: EngineEvent[];
  records: EngineRecord[];
} & Omit<Progress, "weeklyGoal" | "recentRecords">;

// --- Personal records -------------------------------------------------------

type ExerciseBest = {
  maxWeight: EngineSet | null;
  repsByWeight: Map<number, number>;
  maxBodyweightReps: number | null;
};

/**
 * The single best record (if any) this workout's sets set against the
 * exercise's history *before* the workout. Priority: heavier weight, then
 * more reps at a known weight, then more bodyweight reps. A first-ever
 * session is a baseline, not a record.
 */
function detectRecord(
  best: ExerciseBest | undefined,
  sets: EngineSet[],
): Pick<EngineRecord, "kind" | "reps" | "weightKg" | "previous"> | null {
  if (!best) return null;

  const weighted = sets.filter((set) => set.weightKg !== null);
  if (weighted.length > 0 && best.maxWeight) {
    const top = weighted.reduce((a, b) =>
      b.weightKg! > a.weightKg! ||
      (b.weightKg === a.weightKg && b.reps > a.reps)
        ? b
        : a,
    );
    if (top.weightKg! > best.maxWeight.weightKg!) {
      return { kind: "weight", ...top, previous: best.maxWeight };
    }

    const improved = weighted
      .filter((set) => {
        const previousReps = best.repsByWeight.get(set.weightKg!);
        return previousReps !== undefined && set.reps > previousReps;
      })
      .sort((a, b) => b.weightKg! - a.weightKg! || b.reps - a.reps)[0];
    if (improved) {
      return {
        kind: "reps_at_weight",
        ...improved,
        previous: {
          reps: best.repsByWeight.get(improved.weightKg!)!,
          weightKg: improved.weightKg,
        },
      };
    }
  }

  const bodyweightReps = sets
    .filter((set) => set.weightKg === null)
    .map((set) => set.reps);
  if (bodyweightReps.length > 0 && best.maxBodyweightReps !== null) {
    const reps = Math.max(...bodyweightReps);
    if (reps > best.maxBodyweightReps) {
      return {
        kind: "bodyweight_reps",
        reps,
        weightKg: null,
        previous: { reps: best.maxBodyweightReps, weightKg: null },
      };
    }
  }

  return null;
}

function updateBest(best: ExerciseBest | undefined, sets: EngineSet[]) {
  const next: ExerciseBest = best ?? {
    maxWeight: null,
    repsByWeight: new Map(),
    maxBodyweightReps: null,
  };
  for (const set of sets) {
    if (set.weightKg === null) {
      next.maxBodyweightReps = Math.max(next.maxBodyweightReps ?? 0, set.reps);
      continue;
    }
    if (
      !next.maxWeight ||
      set.weightKg > next.maxWeight.weightKg! ||
      (set.weightKg === next.maxWeight.weightKg &&
        set.reps > next.maxWeight.reps)
    ) {
      next.maxWeight = set;
    }
    next.repsByWeight.set(
      set.weightKg,
      Math.max(next.repsByWeight.get(set.weightKg) ?? 0, set.reps),
    );
  }
  return next;
}

// --- Weeks, streaks and totals ------------------------------------------------

/** Goal in force for a week: the latest change effective by its Monday. */
function goalForWeek(goals: GoalChange[], weekStart: DayKey): number {
  let goal = goals[0]?.daysPerWeek ?? DEFAULT_WEEKLY_GOAL;
  for (const change of goals) {
    if (change.effectiveFrom <= weekStart) goal = change.daysPerWeek;
  }
  return goal;
}

function bestPeriod(points: Map<string, number>) {
  let best: { period: string; points: number } | null = null;
  for (const [period, value] of [...points].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (value > 0 && (!best || value > best.points))
      best = { period, points: value };
  }
  return best;
}

export function computeProgress({
  workouts,
  goals,
  timeZone,
  now,
}: EngineInput): EngineResult {
  const sortedGoals = [...goals].sort((a, b) =>
    a.effectiveFrom.localeCompare(b.effectiveFrom),
  );
  const ordered = [...workouts].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
  );

  const events: EngineEvent[] = [];
  const records: EngineRecord[] = [];
  const bests = new Map<string, ExerciseBest>();
  /** Per week, its trained days in order, each with the first workout that day. */
  const weeks = new Map<DayKey, { day: DayKey; workoutId: string }[]>();

  for (const workout of ordered) {
    const day = localDayKey(workout.startedAt, timeZone);
    events.push({
      type: "workout",
      points: POINTS.workout,
      workoutId: workout.id,
      day,
    });

    const days = weeks.get(weekStartOf(day)) ?? [];
    if (!days.some((d) => d.day === day))
      days.push({ day, workoutId: workout.id });
    weeks.set(weekStartOf(day), days);

    // The same exercise twice in one workout is judged as one.
    const setsByExercise = new Map<string, EngineSet[]>();
    for (const { exerciseId, sets } of workout.exercises) {
      setsByExercise.set(exerciseId, [
        ...(setsByExercise.get(exerciseId) ?? []),
        ...sets,
      ]);
    }
    for (const [exerciseId, sets] of setsByExercise) {
      const best = bests.get(exerciseId);
      const found = detectRecord(best, sets);
      if (found) {
        const record: EngineRecord = {
          workoutId: workout.id,
          exerciseId,
          achievedAt: workout.startedAt,
          ...found,
        };
        records.push(record);
        events.push({
          type: "personal_record",
          points: POINTS.personalRecord,
          workoutId: workout.id,
          record,
          day,
        });
      }
      bests.set(exerciseId, updateBest(best, sets));
    }
  }

  const today = localDayKey(now, timeZone);
  const currentWeek = weekStartOf(today);
  const firstWeek = ordered[0]
    ? weekStartOf(localDayKey(ordered[0].startedAt, timeZone))
    : currentWeek;

  let streak = 0;
  let bestStreak = 0;
  for (let week = firstWeek; week <= currentWeek; week = addDays(week, 7)) {
    const days = weeks.get(week) ?? [];
    const goal = goalForWeek(sortedGoals, week);

    if (days.length < goal) {
      // An unfinished current week can still be completed, and the very
      // first week is a trial (you may have started on a Thursday): neither
      // breaks the streak.
      if (week !== currentWeek && week !== firstWeek) streak = 0;
      continue;
    }

    const completing = days[goal - 1]!;
    events.push({
      type: "week_completed",
      points: POINTS.weekCompleted,
      workoutId: completing.workoutId,
      day: completing.day,
    });
    for (const extra of days.slice(goal, goal + MAX_REWARDED_EXTRA_DAYS)) {
      events.push({
        type: "extra_day",
        points: POINTS.extraDay,
        workoutId: extra.workoutId,
        day: extra.day,
      });
    }

    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
    if (streak % STREAK_BONUS_EVERY_WEEKS === 0) {
      events.push({
        type: "four_week_streak",
        points: POINTS.fourWeekStreak,
        workoutId: completing.workoutId,
        streakWeeks: streak,
        day: completing.day,
      });
    }
  }

  const weekPoints = new Map<string, number>();
  const monthPoints = new Map<string, number>();
  let totalPoints = 0;
  for (const event of events) {
    totalPoints += event.points;
    const week = weekStartOf(event.day);
    const month = monthOf(event.day);
    weekPoints.set(week, (weekPoints.get(week) ?? 0) + event.points);
    monthPoints.set(month, (monthPoints.get(month) ?? 0) + event.points);
  }

  return {
    events,
    records,
    totalPoints,
    thisWeek: {
      weekStart: currentWeek,
      points: weekPoints.get(currentWeek) ?? 0,
      daysTrained: weeks.get(currentWeek)?.length ?? 0,
      goal: goalForWeek(sortedGoals, currentWeek),
    },
    thisMonth: {
      period: monthOf(today),
      points: monthPoints.get(monthOf(today)) ?? 0,
    },
    bestWeek: bestPeriod(weekPoints),
    bestMonth: bestPeriod(monthPoints),
    streak: { current: streak, best: bestStreak },
  };
}
