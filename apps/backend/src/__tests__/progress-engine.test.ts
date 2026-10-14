import type { MuscleGroup } from "@pep-fit/shared-types";
import { describe, expect, it } from "vitest";

import {
  addDays,
  localDayKey,
  mondaysOf,
  weekStartOf,
} from "../modules/progress/calendar.js";
import {
  computeProgress,
  type EngineSet,
  type EngineWorkout,
  type GoalChange,
} from "../modules/progress/engine.js";

const TZ = "Europe/Madrid";
const SQUAT = "00000000-0000-4000-8000-00000000000a";
const BENCH = "00000000-0000-4000-8000-00000000000b";
const PULLUP = "00000000-0000-4000-8000-00000000000c";
const CURL = "00000000-0000-4000-8000-00000000000d";
const ROW = "00000000-0000-4000-8000-00000000000e";
const PRESS = "00000000-0000-4000-8000-00000000000f";

/** Canonical name and primary muscle of the test exercises. */
const META: Record<string, { name: string; primaryMuscle: MuscleGroup }> = {
  [SQUAT]: { name: "Barbell Squat", primaryMuscle: "quadriceps" },
  [BENCH]: {
    name: "Barbell Bench Press - Medium Grip",
    primaryMuscle: "chest",
  },
  [PULLUP]: { name: "Pullups", primaryMuscle: "lats" },
  [CURL]: { name: "Barbell Curl", primaryMuscle: "biceps" },
  [ROW]: { name: "Bent Over Barbell Row", primaryMuscle: "middle_back" },
  [PRESS]: { name: "Standing Military Press", primaryMuscle: "shoulders" },
};

let sequence = 0;
/** A one-hour workout at 18:00 Madrid time (16:00 UTC in October) on `day`. */
function workout(
  day: string,
  exercises: Record<string, EngineSet[]> = {
    [SQUAT]: [{ reps: 5, weightKg: 100 }],
  },
  time = "16:00",
  minutes = 60,
): EngineWorkout {
  const startedAt = new Date(`${day}T${time}:00Z`);
  return {
    id: `w${++sequence}`,
    startedAt,
    finishedAt: new Date(startedAt.getTime() + minutes * 60_000),
    exercises: Object.entries(exercises).map(([exerciseId, sets]) => ({
      exerciseId,
      ...META[exerciseId]!,
      sets,
    })),
  };
}

const run = (
  workouts: EngineWorkout[],
  {
    goals = [{ daysPerWeek: 2, effectiveFrom: "2026-09-28" }],
    now = new Date("2026-10-28T12:00:00Z"), // a Wednesday
  }: { goals?: GoalChange[]; now?: Date } = {},
) => computeProgress({ workouts, goals, timeZone: TZ, now });

/** Non-medal event types of a workout (medals have their own tests). */
const typesOf = (result: ReturnType<typeof run>, workoutId: string) =>
  result.events
    .filter((event) => event.workoutId === workoutId)
    .filter((event) => event.type !== "achievement")
    .map((event) => event.type);

const medalsOf = (result: ReturnType<typeof run>, workoutId?: string) =>
  result.events
    .filter((event) => event.type === "achievement")
    .filter((event) => !workoutId || event.workoutId === workoutId)
    .map((event) => `${event.achievementId}:${event.tier}`);

const statusOf = (result: ReturnType<typeof run>, id: string) =>
  result.achievements.find((achievement) => achievement.id === id)!;

const pointsWithoutMedals = (result: ReturnType<typeof run>) =>
  result.events
    .filter((event) => event.type !== "achievement")
    .reduce((sum, event) => sum + event.points, 0);

describe("calendar", () => {
  it("uses the local date, not the UTC one", () => {
    // Monday 00:30 in Madrid is still Sunday 22:30 UTC.
    expect(localDayKey(new Date("2026-10-11T22:30:00Z"), TZ)).toBe(
      "2026-10-12",
    );
    expect(localDayKey(new Date("2026-10-11T22:30:00Z"), "UTC")).toBe(
      "2026-10-11",
    );
  });

  it("weeks start on Monday", () => {
    expect(weekStartOf("2026-10-14")).toBe("2026-10-12"); // Wednesday
    expect(weekStartOf("2026-10-12")).toBe("2026-10-12"); // Monday
    expect(weekStartOf("2026-10-18")).toBe("2026-10-12"); // Sunday
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });
});

describe("personal records", () => {
  it("treats the first session of an exercise as a baseline", () => {
    const result = run([workout("2026-10-05")]);
    expect(result.records).toEqual([]);
  });

  it("detects a heavier weight", () => {
    const first = workout("2026-10-05", {
      [SQUAT]: [{ reps: 5, weightKg: 100 }],
    });
    const second = workout("2026-10-07", {
      [SQUAT]: [
        { reps: 5, weightKg: 100 },
        { reps: 2, weightKg: 105 },
      ],
    });
    const { records } = run([first, second]);
    expect(records).toMatchObject([
      {
        workoutId: second.id,
        kind: "weight",
        reps: 2,
        weightKg: 105,
        previous: { reps: 5, weightKg: 100 },
      },
    ]);
  });

  it("detects more reps at a weight used before", () => {
    const first = workout("2026-10-05", {
      [SQUAT]: [
        { reps: 3, weightKg: 110 },
        { reps: 6, weightKg: 80 },
      ],
    });
    const second = workout("2026-10-07", {
      [SQUAT]: [{ reps: 8, weightKg: 80 }],
    });
    expect(run([first, second]).records).toMatchObject([
      { kind: "reps_at_weight", reps: 8, weightKg: 80, previous: { reps: 6 } },
    ]);
  });

  it("ignores reps at a weight never used, and equal performances", () => {
    const first = workout("2026-10-05", {
      [SQUAT]: [{ reps: 5, weightKg: 100 }],
    });
    const second = workout("2026-10-07", {
      [SQUAT]: [
        { reps: 12, weightKg: 60 }, // new lighter weight: not a record
        { reps: 5, weightKg: 100 }, // equal: not a record
      ],
    });
    expect(run([first, second]).records).toEqual([]);
  });

  it("detects more bodyweight reps", () => {
    const first = workout("2026-10-05", {
      [PULLUP]: [{ reps: 8, weightKg: null }],
    });
    const second = workout("2026-10-07", {
      [PULLUP]: [
        { reps: 10, weightKg: null },
        { reps: 9, weightKg: null },
      ],
    });
    expect(run([first, second]).records).toMatchObject([
      {
        kind: "bodyweight_reps",
        reps: 10,
        weightKg: null,
        previous: { reps: 8 },
      },
    ]);
  });

  it("awards at most one record per exercise per workout, and per exercise", () => {
    const first = workout("2026-10-05", {
      [SQUAT]: [{ reps: 5, weightKg: 100 }],
      [BENCH]: [{ reps: 5, weightKg: 60 }],
    });
    const second = workout("2026-10-07", {
      [SQUAT]: [
        { reps: 6, weightKg: 100 }, // reps record...
        { reps: 1, weightKg: 110 }, // ...but the weight record wins
      ],
      [BENCH]: [{ reps: 5, weightKg: 62.5 }],
    });
    const { records, events } = run([first, second]);
    expect(records.map((r) => [r.exerciseId, r.kind])).toEqual([
      [SQUAT, "weight"],
      [BENCH, "weight"],
    ]);
    expect(events.filter((e) => e.type === "personal_record")).toHaveLength(2);
  });

  it("follows the order the workouts happened, not the order given", () => {
    const later = workout("2026-10-07", {
      [SQUAT]: [{ reps: 5, weightKg: 110 }],
    });
    const earlier = workout("2026-10-05", {
      [SQUAT]: [{ reps: 5, weightKg: 100 }],
    });
    expect(run([later, earlier]).records).toMatchObject([
      { workoutId: later.id, weightKg: 110 },
    ]);
  });
});

describe("weeks, extra days and points", () => {
  it("awards a workout, a completed week and capped extra days", () => {
    // Goal 2; trained Mon, Tue, Wed, Thu, Fri of the week of 5 Oct.
    const days = ["05", "06", "07", "08", "09"].map((d) =>
      workout(`2026-10-${d}`, {}),
    );
    const result = run(days);

    expect(typesOf(result, days[0]!.id)).toEqual(["workout"]);
    expect(typesOf(result, days[1]!.id)).toEqual(["workout", "week_completed"]);
    expect(typesOf(result, days[2]!.id)).toEqual(["workout", "extra_day"]);
    expect(typesOf(result, days[3]!.id)).toEqual(["workout", "extra_day"]);
    expect(typesOf(result, days[4]!.id)).toEqual(["workout"]); // cap of 2
  });

  it("counts days, not workouts", () => {
    const morning = workout("2026-10-05", {}, "06:00");
    const evening = workout("2026-10-05", {}, "17:00");
    const result = run([morning, evening], {
      now: new Date("2026-10-07T12:00:00Z"),
    });
    expect(result.thisWeek).toMatchObject({ daysTrained: 1, goal: 2 });
    expect([morning, evening].flatMap((w) => typesOf(result, w.id))).toEqual([
      "workout",
      "workout",
    ]);
  });

  it("totals points and tracks this week, this month and the best ones", () => {
    const workouts = [
      workout("2026-10-26", {}), // Mon
      workout("2026-10-27", {}), // Tue → week completed
    ];
    const result = run(workouts);
    expect(pointsWithoutMedals(result)).toBe(5 + 5 + 20);
    // Everything happened this week and month, medals included.
    const total = result.totalPoints;
    expect(total).toBeGreaterThan(30);
    expect(result.thisWeek).toEqual({
      weekStart: "2026-10-26",
      points: total,
      daysTrained: 2,
      goal: 2,
    });
    expect(result.thisMonth).toEqual({ period: "2026-10", points: total });
    expect(result.bestWeek).toEqual({ period: "2026-10-26", points: total });
  });
});

describe("streaks", () => {
  /** Two workouts (goal met) in each of the weeks starting on these Mondays. */
  const completeWeeks = (...mondays: string[]) =>
    mondays.flatMap((monday) => [
      workout(monday, {}),
      workout(addDays(monday, 2), {}),
    ]);

  it("counts consecutive completed weeks and pays a bonus every 4", () => {
    const workouts = completeWeeks(
      "2026-09-28",
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
    );
    const result = run(workouts);
    expect(result.streak).toEqual({ current: 4, best: 4 });
    const bonus = result.events.filter((e) => e.type === "four_week_streak");
    expect(bonus).toMatchObject([{ points: 50, streakWeeks: 4 }]);
  });

  it("breaks on a missed week but keeps the best", () => {
    const workouts = completeWeeks("2026-09-28", "2026-10-05", "2026-10-19");
    // Week of 12 Oct had no workouts.
    expect(run(workouts).streak).toEqual({ current: 1, best: 2 });
  });

  it("doesn't break on the current, unfinished week", () => {
    const workouts = [
      ...completeWeeks("2026-10-12", "2026-10-19"),
      workout("2026-10-26", {}), // 1 of 2 so far, it's Wednesday
    ];
    expect(run(workouts).streak.current).toBe(2);
  });

  it("treats the first week as a trial (e.g. starting on a Thursday)", () => {
    // Starts Thursday 1 Oct with just one day: goal of 2 not met...
    const workouts = [
      workout("2026-10-01", {}),
      ...completeWeeks("2026-10-05", "2026-10-12"),
    ];
    // ...but it neither counts nor breaks anything.
    const now = new Date("2026-10-14T12:00:00Z"); // Wednesday, week of 12 Oct
    expect(run(workouts, { now }).streak).toEqual({ current: 2, best: 2 });

    // And if the first week is completed, it counts.
    const strongStart = [
      workout("2026-10-01", {}),
      workout("2026-10-03", {}),
      ...completeWeeks("2026-10-05"),
    ];
    expect(run(strongStart, { now }).streak).toEqual({ current: 2, best: 2 });
  });
});

describe("weekly goal changes", () => {
  it("judges each week by the goal it had", () => {
    const goals: GoalChange[] = [
      { daysPerWeek: 2, effectiveFrom: "2026-10-05" },
      { daysPerWeek: 3, effectiveFrom: "2026-10-12" },
    ];
    const twoDaysEach = [
      workout("2026-10-05", {}),
      workout("2026-10-06", {}),
      workout("2026-10-12", {}),
      workout("2026-10-13", {}),
    ];
    const result = run(twoDaysEach, {
      goals,
      now: new Date("2026-10-21T12:00:00Z"),
    });
    const completed = result.events.filter((e) => e.type === "week_completed");
    expect(completed.map((e) => e.day)).toEqual(["2026-10-06"]); // not week 12
    expect(result.thisWeek.goal).toBe(3);
  });

  it("applies the first goal set to earlier history", () => {
    const only = workout("2026-10-05", {});
    const result = run([only], {
      goals: [{ daysPerWeek: 1, effectiveFrom: "2026-10-26" }],
    });
    expect(typesOf(result, only.id)).toEqual(["workout", "week_completed"]);
  });
});

describe("achievements", () => {
  it("dates each medal at the workout that crossed its threshold", () => {
    const workouts = Array.from({ length: 10 }, (_, i) =>
      workout(addDays("2026-09-01", i * 3), {}),
    );
    const result = run(workouts);
    expect(medalsOf(result, workouts[0]!.id)).toContain("workouts:1");
    expect(medalsOf(result, workouts[9]!.id)).toContain("workouts:2");
    expect(statusOf(result, "workouts")).toMatchObject({ value: 10, tier: 2 });
    expect(statusOf(result, "workouts").unlockedAt.slice(0, 3)).toEqual([
      workouts[0]!.startedAt,
      workouts[9]!.startedAt,
      null,
    ]);
  });

  it("awards every tier passed at once, with their points", () => {
    const heavy = workout("2026-10-05", {
      [BENCH]: [{ reps: 1, weightKg: 85 }],
    });
    const result = run([heavy]);
    // Bench thresholds 40 / 60 / 80 / 110 / 140.
    expect(medalsOf(result, heavy.id)).toEqual(
      expect.arrayContaining(["bench_king:1", "bench_king:2", "bench_king:3"]),
    );
    const benchPoints = result.events
      .filter((e) => e.achievementId === "bench_king")
      .reduce((sum, e) => sum + e.points, 0);
    expect(benchPoints).toBe(10 + 20 + 40);
  });

  it("only counts the key lifts for strength medals", () => {
    const curls = workout("2026-10-05", {
      [CURL]: [{ reps: 8, weightKg: 200 }],
    });
    expect(statusOf(run([curls]), "bench_king").value).toBe(0);
  });

  it("tracks pull-ups, bodyweight sets and leg days", () => {
    const result = run([
      workout("2026-10-05", {
        [PULLUP]: [
          { reps: 6, weightKg: null },
          { reps: 4, weightKg: null },
        ],
        [SQUAT]: [{ reps: 5, weightKg: 60 }],
      }),
    ]);
    expect(statusOf(result, "pull_up_master")).toMatchObject({
      value: 6,
      tier: 2,
    });
    expect(statusOf(result, "bodyweight").value).toBe(2);
    expect(statusOf(result, "leg_day").value).toBe(1);
  });

  it("recognises habits in local time", () => {
    const result = run([
      workout("2026-10-05", {}, "05:30"), // 07:30 in Madrid → early bird
      workout("2026-10-06", {}, "20:30"), // 22:30 in Madrid → night owl
      workout("2026-10-10", {}), // Saturday → weekend
      workout("2026-10-12", {}, "16:00", 95), // 95 min → marathon
    ]);
    expect(statusOf(result, "early_bird").value).toBe(1);
    expect(statusOf(result, "night_owl").value).toBe(1);
    expect(statusOf(result, "weekend_warrior").value).toBe(1);
    expect(statusOf(result, "marathoner").value).toBe(1);
  });

  it("counts a comeback after two weeks or more without training", () => {
    const result = run([
      workout("2026-10-01", {}),
      workout("2026-10-14", {}), // 13 days: not yet
      workout("2026-10-28", {}), // 14 days: comeback
    ]);
    expect(statusOf(result, "comeback").value).toBe(1);
  });

  it("detects a full-body week when all major groups are trained", () => {
    const monday = workout("2026-10-05", {
      [BENCH]: [{ reps: 5, weightKg: 50 }],
      [ROW]: [{ reps: 8, weightKg: 50 }],
    });
    const wednesday = workout("2026-10-07", {
      [SQUAT]: [{ reps: 5, weightKg: 60 }],
      [PRESS]: [{ reps: 5, weightKg: 30 }],
    });
    const friday = workout("2026-10-09", {
      [CURL]: [{ reps: 10, weightKg: 20 }],
    });
    const result = run([monday, wednesday, friday]);
    expect(medalsOf(result, friday.id)).toContain("full_body:1");
    expect(statusOf(result, "full_body").value).toBe(1);
  });

  it("counts weeks, streaks, extra days and perfect months", () => {
    // October 2026 has four Mondays: 5, 12, 19 and 26. Goal: 2 days.
    const october = ["2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26"];
    const workouts = october.flatMap((monday) => [
      workout(monday, {}),
      workout(addDays(monday, 2), {}),
    ]);
    workouts.push(workout("2026-10-06", {})); // one extra day in week 1
    const result = run(workouts, { now: new Date("2026-10-30T12:00:00Z") });

    expect(statusOf(result, "consistent").value).toBe(4);
    expect(statusOf(result, "unstoppable").value).toBe(4);
    expect(statusOf(result, "extra_mile").value).toBe(1);
    expect(statusOf(result, "perfect_month").value).toBe(1);
    // Awarded when the last week of the month was completed (Wed 28).
    const lastWednesday = workouts[7]!;
    expect(medalsOf(result, lastWednesday.id)).toContain("perfect_month:1");
  });

  it("adds medal points to the totals", () => {
    const result = run([workout("2026-10-05", {})]);
    const medalPoints = result.events
      .filter((e) => e.type === "achievement")
      .reduce((sum, e) => sum + e.points, 0);
    expect(medalPoints).toBeGreaterThan(0);
    expect(result.totalPoints).toBe(pointsWithoutMedals(result) + medalPoints);
  });
});

describe("mondaysOf", () => {
  it("lists the weeks that start in a month", () => {
    expect(mondaysOf("2026-10")).toEqual([
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
      "2026-10-26",
    ]);
    // June 2026 starts on a Monday.
    expect(mondaysOf("2026-06")[0]).toBe("2026-06-01");
  });
});
