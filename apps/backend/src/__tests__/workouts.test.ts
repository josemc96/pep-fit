import "dotenv/config";

import { prisma } from "@pep-fit/db";
import type { WorkoutInput } from "@pep-fit/shared-types";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { buildApp } from "../app.js";
import { loadEnv } from "../config/env.js";
import { authAs as as, dbAvailable, deleteTestUsers } from "./support/db.js";

const TEST_USER_PREFIX = "test_workouts_";
vi.mock("@clerk/backend", () => import("./support/clerk-mock.js"));

describe.skipIf(!dbAvailable)("workouts API", () => {
  const app = buildApp(loadEnv({ ...process.env, NODE_ENV: "test" }));
  const alice = `${TEST_USER_PREFIX}alice_${Date.now()}`;
  const bob = `${TEST_USER_PREFIX}bob_${Date.now()}`;
  let exerciseIds: string[] = [];
  let routineId = "";

  const workoutInput = (
    overrides: Partial<WorkoutInput> = {},
  ): WorkoutInput => ({
    routineId,
    routineDayIndex: 1,
    startedAt: "2026-10-13T18:00:00.000Z",
    finishedAt: "2026-10-13T19:00:00.000Z",
    exercises: [
      {
        exerciseId: exerciseIds[0]!,
        sets: [
          { reps: 8, weightKg: 60 },
          { reps: 8, weightKg: 60 },
        ],
      },
      { exerciseId: exerciseIds[1]!, sets: [{ reps: 15, weightKg: null }] },
    ],
    ...overrides,
  });

  const postWorkout = (user: string, payload: unknown) =>
    app.inject({
      method: "POST",
      url: "/workouts",
      headers: as(user),
      payload: payload as object,
    });

  const latest = async (user: string, query = "") =>
    (
      await app.inject({
        method: "GET",
        url: `/workouts/latest${query}`,
        headers: as(user),
      })
    ).json().workout;

  beforeAll(async () => {
    await app.ready();
    const exercises = await prisma.exercise.findMany({
      take: 2,
      orderBy: { name: "asc" },
      select: { id: true },
    });
    exerciseIds = exercises.map((exercise) => exercise.id);

    const routine = await app.inject({
      method: "POST",
      url: "/routines",
      headers: as(alice),
      payload: {
        name: "Torso / Pierna",
        days: [
          { name: "Torso", exercises: [] },
          { name: "Pierna", exercises: [] },
        ],
      },
    });
    routineId = routine.json().id;
  });

  afterAll(async () => {
    await deleteTestUsers(TEST_USER_PREFIX);
    await app.close();
  });

  it("requires authentication", async () => {
    const response = await app.inject({ method: "POST", url: "/workouts" });
    expect(response.statusCode).toBe(401);
  });

  it("has no latest workout before the first one", async () => {
    expect(await latest(alice)).toBeNull();
  });

  it("stores a workout and snapshots routine and day names", async () => {
    const response = await postWorkout(alice, workoutInput());
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      routineId,
      routineName: "Torso / Pierna",
      routineDayIndex: 1,
      dayName: "Pierna",
      exerciseCount: 2,
      setCount: 3,
    });

    const stored = await prisma.workoutSession.findUniqueOrThrow({
      where: { id: response.json().id },
      include: {
        exercises: {
          orderBy: { position: "asc" },
          include: { sets: { orderBy: { position: "asc" } } },
        },
      },
    });
    expect(stored.exercises.map((e) => e.exerciseId)).toEqual(exerciseIds);
    expect(stored.exercises[1]!.sets[0]).toMatchObject({
      reps: 15,
      weightKg: null,
    });
  });

  it("returns the most recent workout, per routine when asked", async () => {
    await postWorkout(
      alice,
      workoutInput({
        routineId: null,
        routineDayIndex: null,
        startedAt: "2026-10-14T18:00:00.000Z",
        finishedAt: "2026-10-14T18:30:00.000Z",
      }),
    );

    expect(await latest(alice)).toMatchObject({ routineId: null });
    expect(await latest(alice, `?routineId=${routineId}`)).toMatchObject({
      routineId,
      routineDayIndex: 1,
    });
  });

  it("ignores a routine that belongs to someone else", async () => {
    const response = await postWorkout(bob, workoutInput());
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      routineId: null,
      routineName: null,
      dayName: null,
    });
    // Bob's workout must not count as Alice's routine progress.
    expect(await latest(alice, `?routineId=${routineId}`)).toMatchObject({
      startedAt: "2026-10-13T18:00:00.000Z",
    });
  });

  it("keeps history when the routine is deleted", async () => {
    const before = await latest(alice, `?routineId=${routineId}`);
    await app.inject({
      method: "DELETE",
      url: `/routines/${routineId}`,
      headers: as(alice),
    });

    const session = await prisma.workoutSession.findUniqueOrThrow({
      where: { id: before.id },
    });
    expect(session).toMatchObject({
      routineId: null,
      routineName: "Torso / Pierna",
      dayName: "Pierna",
    });
  });

  it("rejects invalid workouts with a 400", async () => {
    const unknownExercise = workoutInput({
      exercises: [
        {
          exerciseId: "00000000-0000-4000-8000-000000000000",
          sets: [{ reps: 5, weightKg: 100 }],
        },
      ],
    });
    const endsBeforeStart = workoutInput({
      finishedAt: "2026-10-13T17:00:00.000Z",
    });

    for (const payload of [
      unknownExercise,
      endsBeforeStart,
      { exercises: [] },
    ]) {
      expect((await postWorkout(alice, payload)).statusCode).toBe(400);
    }
  });
});
