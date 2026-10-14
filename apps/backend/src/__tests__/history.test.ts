import "dotenv/config";

import { prisma } from "@pep-fit/db";
import type { WorkoutInput } from "@pep-fit/shared-types";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { buildApp } from "../app.js";
import { loadEnv } from "../config/env.js";
import { authAs as as, dbAvailable, deleteTestUsers } from "./support/db.js";

const TEST_USER_PREFIX = "test_history_";
vi.mock("@clerk/backend", () => import("./support/clerk-mock.js"));

describe.skipIf(!dbAvailable)("workout history API", () => {
  const app = buildApp(loadEnv({ ...process.env, NODE_ENV: "test" }));
  const alice = `${TEST_USER_PREFIX}alice_${Date.now()}`;
  const bob = `${TEST_USER_PREFIX}bob_${Date.now()}`;
  let squatId = "";
  let benchId = "";
  const workoutIds: string[] = [];

  /** A workout on 2026-10-<day> with the given squat weight. */
  const workout = (day: number, squatKg: number): WorkoutInput => ({
    routineId: null,
    routineDayIndex: null,
    startedAt: `2026-10-${String(day).padStart(2, "0")}T18:00:00.000Z`,
    finishedAt: `2026-10-${String(day).padStart(2, "0")}T19:00:00.000Z`,
    exercises: [
      {
        exerciseId: squatId,
        sets: [
          { reps: 5, weightKg: squatKg },
          { reps: 5, weightKg: squatKg },
        ],
      },
      ...(day === 1
        ? [{ exerciseId: benchId, sets: [{ reps: 10, weightKg: null }] }]
        : []),
    ],
  });

  const get = (user: string, url: string) =>
    app.inject({ method: "GET", url, headers: as(user) });

  beforeAll(async () => {
    await app.ready();
    const [first, second] = await prisma.exercise.findMany({
      take: 2,
      orderBy: { name: "asc" },
      select: { id: true },
    });
    squatId = first!.id;
    benchId = second!.id;

    // Posted out of order on purpose: history must sort by date.
    for (const [day, kg] of [
      [2, 100],
      [1, 90],
      [3, 105],
    ] as const) {
      const response = await app.inject({
        method: "POST",
        url: "/workouts",
        headers: as(alice),
        payload: workout(day, kg),
      });
      expect(response.statusCode).toBe(201);
      workoutIds.push(response.json().id);
    }
  });

  afterAll(async () => {
    await deleteTestUsers(TEST_USER_PREFIX);
    await app.close();
  });

  it("lists workouts newest first, paginated, with volume", async () => {
    const response = await get(alice, "/workouts?pageSize=2");
    expect(response.statusCode).toBe(200);

    const page = response.json();
    expect(page.total).toBe(3);
    expect(page.items.map((w: { startedAt: string }) => w.startedAt)).toEqual([
      "2026-10-03T18:00:00.000Z",
      "2026-10-02T18:00:00.000Z",
    ]);
    expect(page.items[0]).toMatchObject({ setCount: 2, volumeKg: 2 * 5 * 105 });

    const second = (await get(alice, "/workouts?pageSize=2&page=2")).json();
    expect(second.items).toHaveLength(1);
    expect(second.items[0]).toMatchObject({
      exerciseCount: 2,
      setCount: 3,
      volumeKg: 2 * 5 * 90, // the bodyweight set adds nothing
    });
  });

  it("returns a workout's detail with localized exercise names", async () => {
    const day1 = workoutIds[1]!;
    const response = await get(alice, `/workouts/${day1}?lang=es`);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: day1,
      exercises: [
        {
          exercise: { id: squatId, name: "Abdominal 3/4" },
          sets: [
            { reps: 5, weightKg: 90 },
            { reps: 5, weightKg: 90 },
          ],
        },
        { exercise: { id: benchId }, sets: [{ reps: 10, weightKg: null }] },
      ],
    });
  });

  it("returns the sets from the last time each exercise was done", async () => {
    const response = await get(
      alice,
      `/workouts/previous-sets?exerciseIds=${squatId},${benchId}`,
    );
    expect(response.json().items).toEqual(
      expect.arrayContaining([
        {
          exerciseId: squatId,
          performedAt: "2026-10-03T19:00:00.000Z",
          sets: [
            { reps: 5, weightKg: 105 },
            { reps: 5, weightKg: 105 },
          ],
        },
        {
          exerciseId: benchId,
          performedAt: "2026-10-01T19:00:00.000Z",
          sets: [{ reps: 10, weightKg: null }],
        },
      ]),
    );

    // Bob has never trained: nothing to compare with.
    const bobs = await get(
      bob,
      `/workouts/previous-sets?exerciseIds=${squatId}`,
    );
    expect(bobs.json().items).toEqual([]);
  });

  it("keeps other users' workouts private", async () => {
    expect((await get(bob, "/workouts")).json().total).toBe(0);
    expect((await get(bob, `/workouts/${workoutIds[0]}`)).statusCode).toBe(404);

    const deleted = await app.inject({
      method: "DELETE",
      url: `/workouts/${workoutIds[0]}`,
      headers: as(bob),
    });
    expect(deleted.statusCode).toBe(404);
  });

  it("deletes a workout", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: `/workouts/${workoutIds[0]}`,
      headers: as(alice),
    });
    expect(response.statusCode).toBe(204);
    expect((await get(alice, "/workouts")).json().total).toBe(2);
    expect((await get(alice, `/workouts/${workoutIds[0]}`)).statusCode).toBe(
      404,
    );
  });
});
