import { describe, expect, it } from "vitest";

import {
  addDays,
  localDayKey,
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

let sequence = 0;
/** A workout at 18:00 Madrid time (16:00 UTC in October) on `day`. */
function workout(
  day: string,
  exercises: Record<string, EngineSet[]> = {
    [SQUAT]: [{ reps: 5, weightKg: 100 }],
  },
  time = "16:00",
): EngineWorkout {
  return {
    id: `w${++sequence}`,
    startedAt: new Date(`${day}T${time}:00Z`),
    exercises: Object.entries(exercises).map(([exerciseId, sets]) => ({
      exerciseId,
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

const typesOf = (result: ReturnType<typeof run>, workoutId: string) =>
  result.events
    .filter((event) => event.workoutId === workoutId)
    .map((event) => event.type);

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
    expect(result.events.map((e) => e.type)).toEqual(["workout", "workout"]);
  });

  it("totals points and tracks this week, this month and the best ones", () => {
    const workouts = [
      workout("2026-10-26", {}), // Mon
      workout("2026-10-27", {}), // Tue → week completed
    ];
    const result = run(workouts);
    expect(result.totalPoints).toBe(5 + 5 + 20);
    expect(result.thisWeek).toEqual({
      weekStart: "2026-10-26",
      points: 30,
      daysTrained: 2,
      goal: 2,
    });
    expect(result.thisMonth).toEqual({ period: "2026-10", points: 30 });
    expect(result.bestWeek).toEqual({ period: "2026-10-26", points: 30 });
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
    const result = run([workout("2026-10-05", {})], {
      goals: [{ daysPerWeek: 1, effectiveFrom: "2026-10-26" }],
    });
    expect(result.events.map((e) => e.type)).toEqual([
      "workout",
      "week_completed",
    ]);
  });
});
