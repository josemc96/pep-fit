import "dotenv/config";

import { prisma } from "@pep-fit/db";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { buildApp } from "../app.js";
import { loadEnv } from "../config/env.js";
import {
  localDayKey,
  weekStartOf,
  addDays,
} from "../modules/progress/calendar.js";
import { authAs, dbAvailable, deleteTestUsers } from "./support/db.js";

const TEST_USER_PREFIX = "test_progress_";
vi.mock("@clerk/backend", () => import("./support/clerk-mock.js"));

const TZ = "Europe/Madrid";

describe.skipIf(!dbAvailable)("progress API", () => {
  const app = buildApp(loadEnv({ ...process.env, NODE_ENV: "test" }));
  const alice = `${TEST_USER_PREFIX}alice_${Date.now()}`;
  const headers = { ...authAs(alice), "x-timezone": TZ };
  let exerciseId = "";

  const thisMonday = weekStartOf(localDayKey(new Date(), TZ));

  const post = (url: string, payload: object) =>
    app.inject({ method: "POST", url, headers, payload });
  const getProgress = async () =>
    (
      await app.inject({ method: "GET", url: "/progress?lang=es", headers })
    ).json();
  const setGoal = (daysPerWeek: number) =>
    app.inject({
      method: "PUT",
      url: "/progress/weekly-goal",
      headers,
      payload: { daysPerWeek },
    });

  /** A finished one-exercise workout `daysAgo` days ago. */
  const logWorkout = (daysAgo: number, weightKg: number) => {
    // Started a minute ago, so "today" stays today (and this week) locally.
    const startedAt = new Date(Date.now() - daysAgo * 86_400_000 - 60_000);
    return post("/workouts?lang=es", {
      routineId: null,
      routineDayIndex: null,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date(startedAt.getTime() + 30_000).toISOString(),
      exercises: [{ exerciseId, sets: [{ reps: 5, weightKg }] }],
    });
  };

  beforeAll(async () => {
    await app.ready();
    const exercise = await prisma.exercise.findFirstOrThrow({
      orderBy: { name: "asc" },
      select: { id: true },
    });
    exerciseId = exercise.id;
  });

  afterAll(async () => {
    await deleteTestUsers(TEST_USER_PREFIX);
    await app.close();
  });

  it("starts empty with the default goal", async () => {
    expect(await getProgress()).toMatchObject({
      totalPoints: 0,
      thisWeek: { weekStart: thisMonday, daysTrained: 0, goal: 3 },
      streak: { current: 0, best: 0 },
      weeklyGoal: { current: 3, next: null },
      bestWeek: null,
      recentRecords: [],
    });
  });

  it("applies the first goal now and later changes from next Monday", async () => {
    const first = await setGoal(1);
    expect(first.statusCode).toBe(200);
    expect(first.json().weeklyGoal).toEqual({ current: 1, next: null });

    const second = await setGoal(4);
    expect(second.json().weeklyGoal).toEqual({
      current: 1,
      next: { daysPerWeek: 4, effectiveFrom: addDays(thisMonday, 7) },
    });

    // Changing your mind before Monday just replaces the pending change.
    const third = await setGoal(1);
    expect(third.json().weeklyGoal).toEqual({ current: 1, next: null });

    expect((await setGoal(8)).statusCode).toBe(400);
  });

  it("returns what a saved workout earned, with named records", async () => {
    // Baseline days ago, then a heavier set now. Goal is 1 day this week.
    await logWorkout(14, 100);
    const response = await logWorkout(0, 105);
    expect(response.statusCode).toBe(201);

    const { progress } = response.json();
    const types = progress.events.map((e: { type: string }) => e.type);
    expect(types).toEqual(
      expect.arrayContaining(["workout", "personal_record", "week_completed"]),
    );
    const record = progress.events.find(
      (e: { type: string }) => e.type === "personal_record",
    ).record;
    expect(record).toMatchObject({
      exerciseId,
      exerciseName: "Abdominal 3/4",
      kind: "weight",
      weightKg: 105,
      previous: { weightKg: 100 },
    });
    const sum = (events: { type: string; points: number }[]) =>
      events.reduce((total, event) => total + event.points, 0);
    const medals = progress.events.filter(
      (e: { type: string }) => e.type === "achievement",
    );
    const others = progress.events.filter(
      (e: { type: string }) => e.type !== "achievement",
    );
    expect(sum(others)).toBe(5 + 10 + 20);
    expect(medals.length).toBeGreaterThan(0);
    expect(progress.pointsEarned).toBe(sum(progress.events));
  });

  it("aggregates totals, this week and recent records", async () => {
    const progress = await getProgress();
    expect(progress.thisWeek).toMatchObject({ daysTrained: 1, goal: 1 });
    expect(progress.thisWeek.points).toBeGreaterThanOrEqual(35);
    expect(progress.totalPoints).toBeGreaterThanOrEqual(
      progress.thisWeek.points,
    );
    expect(progress.streak.current).toBeGreaterThanOrEqual(1);
    expect(progress.recentRecords[0]).toMatchObject({ weightKg: 105 });
    expect(progress.level.minPoints).toBeLessThanOrEqual(progress.totalPoints);
    expect(progress.achievements).toHaveLength(25);
    expect(
      progress.achievements.find((a: { id: string }) => a.id === "workouts"),
    ).toMatchObject({ value: 2, tier: 1 });
  });

  it("recomputes when a workout is deleted", async () => {
    const before = await getProgress();
    const latest = before.recentRecords[0].workoutId;
    await app.inject({ method: "DELETE", url: `/workouts/${latest}`, headers });

    const after = await getProgress();
    expect(after.recentRecords).toEqual([]);
    expect(after.totalPoints).toBeLessThan(before.totalPoints);
  });

  it("lets the web app send its time zone (CORS)", async () => {
    const response = await app.inject({
      method: "OPTIONS",
      url: "/progress",
      headers: {
        origin: "http://localhost:8081",
        "access-control-request-method": "GET",
        "access-control-request-headers": "authorization,x-timezone",
      },
    });
    expect(
      response.headers["access-control-allow-headers"]
        ?.toString()
        .toLowerCase(),
    ).toContain("x-timezone");
  });
});
