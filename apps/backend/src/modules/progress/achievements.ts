import {
  ACHIEVEMENT_IDS,
  MEDAL_POINTS,
  MEDAL_TIERS,
  tierFor,
  type AchievementId,
  type AchievementStatus,
  type MuscleGroup,
} from "@pep-fit/shared-types";

import type { DayKey } from "./calendar.js";

/**
 * Achievement tracking for the progress engine. Metrics are accumulated
 * workout by workout, in order, so each medal is dated (and its points
 * counted) at the exact workout that crossed its threshold.
 */

export type AchievementSet = { reps: number; weightKg: number | null };

export type AchievementWorkout = {
  id: string;
  startedAt: Date;
  finishedAt: Date;
  /** Local calendar facts, resolved by the engine in the user's zone. */
  day: DayKey;
  localHour: number;
  isWeekend: boolean;
  exercises: {
    exerciseId: string;
    /** Canonical (English) name, used to recognise the key lifts. */
    name: string;
    primaryMuscle: MuscleGroup;
    sets: AchievementSet[];
  }[];
};

/** What the rest of the engine learnt about each workout. */
export type WorkoutFacts = {
  records: number;
  extraDays: number;
  /** Streak length when this workout completed its week. */
  completedWeekStreak?: number;
  completedPerfectMonth: boolean;
  completedFullBodyWeek: boolean;
};

export type MedalEvent = {
  workoutId: string;
  day: DayKey;
  achievementId: AchievementId;
  /** 1 = bronze … 5 = diamond. */
  tier: number;
  points: number;
};

// Key lifts, by the canonical free-exercise-db names of their barbell forms.
const LIFTS: Partial<Record<AchievementId, ReadonlySet<string>>> = {
  bench_king: new Set([
    "Barbell Bench Press - Medium Grip",
    "Bench Press - Powerlifting",
    "Wide-Grip Barbell Bench Press",
  ]),
  steel_legs: new Set([
    "Barbell Squat",
    "Barbell Full Squat",
    "Olympic Squat",
    "Wide Stance Barbell Squat",
  ]),
  deadlifter: new Set(["Barbell Deadlift", "Sumo Deadlift"]),
  stone_shoulders: new Set([
    "Standing Military Press",
    "Seated Barbell Military Press",
    "Barbell Shoulder Press",
  ]),
};
const PULL_UPS = new Set([
  "Pullups",
  "Chin-Up",
  "V-Bar Pullup",
  "Weighted Pull Ups",
  "Wide-Grip Rear Pull-Up",
]);

export const LEG_MUSCLES: ReadonlySet<MuscleGroup> = new Set([
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "adductors",
  "abductors",
]);

/** The big groups a "full body" week must all hit (by primary muscle). */
export const MAJOR_MUSCLE_GROUPS: ReadonlyArray<ReadonlySet<MuscleGroup>> = [
  new Set(["chest"]),
  new Set(["lats", "middle_back", "lower_back", "traps"]),
  LEG_MUSCLES,
  new Set(["shoulders"]),
  new Set(["biceps", "triceps", "forearms"]),
];

const COMEBACK_GAP_DAYS = 14;
const EARLY_BIRD_BEFORE_HOUR = 8;
const NIGHT_OWL_FROM_HOUR = 22;
const MARATHON_MINUTES = 90;

const daysBetween = (from: DayKey, to: DayKey) =>
  (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
  86_400_000;

export function computeAchievements(
  workouts: AchievementWorkout[],
  factsByWorkout: Map<string, WorkoutFacts>,
): { medals: MedalEvent[]; statuses: AchievementStatus[] } {
  const value = Object.fromEntries(
    ACHIEVEMENT_IDS.map((id) => [id, 0]),
  ) as Record<AchievementId, number>;
  const unlockedAt = Object.fromEntries(
    ACHIEVEMENT_IDS.map((id) => [id, MEDAL_TIERS.map(() => null)]),
  ) as Record<AchievementId, (Date | null)[]>;
  const exercisesSeen = new Set<string>();
  const medals: MedalEvent[] = [];
  let previousDay: DayKey | null = null;

  const raise = (id: AchievementId, candidate: number) => {
    value[id] = Math.max(value[id], candidate);
  };

  for (const workout of workouts) {
    const facts = factsByWorkout.get(workout.id);
    const sets = workout.exercises.flatMap((exercise) => exercise.sets);
    const volume = sets.reduce(
      (sum, set) => sum + set.reps * (set.weightKg ?? 0),
      0,
    );

    for (const exercise of workout.exercises) {
      exercisesSeen.add(exercise.exerciseId);
      for (const [id, names] of Object.entries(LIFTS) as [
        AchievementId,
        ReadonlySet<string>,
      ][]) {
        if (!names.has(exercise.name)) continue;
        for (const set of exercise.sets) raise(id, set.weightKg ?? 0);
      }
      if (PULL_UPS.has(exercise.name)) {
        for (const set of exercise.sets) raise("pull_up_master", set.reps);
      }
    }
    raise("beast", volume);

    if (facts?.completedWeekStreak !== undefined) {
      value.consistent += 1;
      raise("unstoppable", facts.completedWeekStreak);
    }
    if (facts?.completedPerfectMonth) value.perfect_month += 1;
    if (facts?.completedFullBodyWeek) value.full_body += 1;
    value.extra_mile += facts?.extraDays ?? 0;
    value.record_breaker += facts?.records ?? 0;
    raise("on_fire", facts?.records ?? 0);

    if (
      previousDay &&
      daysBetween(previousDay, workout.day) >= COMEBACK_GAP_DAYS
    ) {
      value.comeback += 1;
    }
    previousDay = workout.day;

    value.workouts += 1;
    value.sets += sets.length;
    value.reps += sets.reduce((sum, set) => sum + set.reps, 0);
    value.tonnage += volume;
    value.explorer = exercisesSeen.size;
    value.bodyweight += sets.filter((set) => set.weightKg === null).length;
    if (workout.exercises.some((e) => LEG_MUSCLES.has(e.primaryMuscle))) {
      value.leg_day += 1;
    }
    if (workout.localHour < EARLY_BIRD_BEFORE_HOUR) value.early_bird += 1;
    if (workout.localHour >= NIGHT_OWL_FROM_HOUR) value.night_owl += 1;
    if (workout.isWeekend) value.weekend_warrior += 1;
    if (
      workout.finishedAt.getTime() - workout.startedAt.getTime() >
      MARATHON_MINUTES * 60_000
    ) {
      value.marathoner += 1;
    }

    // Medals newly reached with this workout.
    for (const id of ACHIEVEMENT_IDS) {
      const reached = tierFor(id, value[id]);
      for (let tier = 1; tier <= reached; tier++) {
        if (unlockedAt[id][tier - 1]) continue;
        unlockedAt[id][tier - 1] = workout.startedAt;
        medals.push({
          workoutId: workout.id,
          day: workout.day,
          achievementId: id,
          tier,
          points: MEDAL_POINTS[tier - 1]!,
        });
      }
    }
  }

  return {
    medals,
    statuses: ACHIEVEMENT_IDS.map((id) => ({
      id,
      value: value[id],
      tier: tierFor(id, value[id]),
      unlockedAt: unlockedAt[id],
    })),
  };
}
