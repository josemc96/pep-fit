import "dotenv/config";

import { prisma } from "@pep-fit/db";
import type { RoutineInput } from "@pep-fit/shared-types";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { buildApp } from "../app.js";
import { loadEnv } from "../config/env.js";

// The bearer token *is* the Clerk user id in these tests, so each test can act
// as any user without talking to Clerk.
const TEST_USER_PREFIX = "test_routines_";
vi.mock("@clerk/backend", () => ({
  verifyToken: async (token: string) => ({ sub: token }),
  createClerkClient: () => ({
    users: {
      getUser: async (id: string) => ({
        id,
        username: null,
        imageUrl: "https://example.com/avatar.png",
        primaryEmailAddressId: "email_1",
        emailAddresses: [{ id: "email_1", emailAddress: `${id}@example.com` }],
      }),
    },
  }),
}));

// These are integration tests against the local Postgres; skip cleanly when
// it isn't running (e.g. a machine without Docker).
const dbAvailable = await prisma.$queryRaw`SELECT 1`.then(
  () => true,
  () => false,
);

describe.skipIf(!dbAvailable)("routines API", () => {
  const app = buildApp(loadEnv({ ...process.env, NODE_ENV: "test" }));
  const alice = `${TEST_USER_PREFIX}alice_${Date.now()}`;
  const bob = `${TEST_USER_PREFIX}bob_${Date.now()}`;
  let exerciseIds: string[] = [];

  const as = (user: string) => ({ authorization: `Bearer ${user}` });

  const routineInput = (name = "Push / Pull"): RoutineInput => ({
    name,
    days: [
      {
        name: "Push",
        exercises: [
          {
            exerciseId: exerciseIds[0]!,
            restSeconds: 120,
            sets: [
              { targetReps: 5, targetWeightKg: 80 },
              { targetReps: 8, targetWeightKg: 70 },
            ],
          },
          {
            exerciseId: exerciseIds[1]!,
            restSeconds: 60,
            sets: [{ targetReps: null, targetWeightKg: null }],
          },
        ],
      },
      { name: "Pull", exercises: [] },
    ],
  });

  async function createRoutine(user: string, name?: string) {
    const response = await app.inject({
      method: "POST",
      url: "/routines?lang=es",
      headers: as(user),
      payload: routineInput(name),
    });
    expect(response.statusCode).toBe(201);
    return response.json<{ id: string }>();
  }

  beforeAll(async () => {
    await app.ready();
    const exercises = await prisma.exercise.findMany({
      take: 2,
      orderBy: { name: "asc" },
      select: { id: true },
    });
    exerciseIds = exercises.map((exercise) => exercise.id);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { clerkId: { startsWith: TEST_USER_PREFIX } },
    });
    await app.close();
  });

  it("requires authentication", async () => {
    const response = await app.inject({ method: "GET", url: "/routines" });
    expect(response.statusCode).toBe(401);
  });

  it("creates a routine and returns the full ordered tree, localized", async () => {
    const created = await createRoutine(alice);

    const response = await app.inject({
      method: "GET",
      url: `/routines/${created.id}?lang=es`,
      headers: as(alice),
    });
    expect(response.statusCode).toBe(200);

    const routine = response.json();
    expect(routine.name).toBe("Push / Pull");
    expect(routine.isActive).toBe(false);
    expect(routine.days.map((day: { name: string }) => day.name)).toEqual([
      "Push",
      "Pull",
    ]);
    const [first] = routine.days[0].exercises;
    expect(first.exerciseId).toBe(exerciseIds[0]);
    expect(first.exercise.name).toBe("Abdominal 3/4"); // "3/4 Sit-Up" in Spanish
    expect(first.restSeconds).toBe(120);
    expect(first.sets).toMatchObject([
      { targetReps: 5, targetWeightKg: 80 },
      { targetReps: 8, targetWeightKg: 70 },
    ]);
  });

  it("lists only the user's own routines", async () => {
    await createRoutine(bob, "Bob's routine");

    const response = await app.inject({
      method: "GET",
      url: "/routines",
      headers: as(alice),
    });
    const names = response.json().map((r: { name: string }) => r.name);
    expect(names).not.toContain("Bob's routine");
    expect(response.json()[0]).toMatchObject({ dayCount: 2 });
  });

  it("hides other users' routines behind a 404", async () => {
    const bobs = await createRoutine(bob);

    for (const [method, payload] of [
      ["GET", undefined],
      ["PUT", routineInput()],
      ["DELETE", undefined],
    ] as const) {
      const response = await app.inject({
        method,
        url: `/routines/${bobs.id}`,
        headers: as(alice),
        payload,
      });
      expect(response.statusCode).toBe(404);
    }

    const activate = await app.inject({
      method: "PUT",
      url: "/me/active-routine",
      headers: as(alice),
      payload: { routineId: bobs.id },
    });
    expect(activate.statusCode).toBe(404);
  });

  it("replaces the whole tree on update", async () => {
    const created = await createRoutine(alice);
    const updated: RoutineInput = {
      name: "Full body",
      days: [
        {
          name: "Day A",
          exercises: [
            {
              exerciseId: exerciseIds[1]!,
              restSeconds: 90,
              sets: [{ targetReps: 10, targetWeightKg: 20 }],
            },
          ],
        },
      ],
    };

    const response = await app.inject({
      method: "PUT",
      url: `/routines/${created.id}`,
      headers: as(alice),
      payload: updated,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      name: "Full body",
      days: [
        {
          name: "Day A",
          exercises: [
            { exerciseId: exerciseIds[1], sets: [{ targetReps: 10 }] },
          ],
        },
      ],
    });
  });

  it("rejects unknown exercises and invalid input with a 400", async () => {
    const unknown = routineInput();
    unknown.days[0]!.exercises[0]!.exerciseId =
      "00000000-0000-4000-8000-000000000000";

    for (const payload of [unknown, { name: "", days: [] }]) {
      const response = await app.inject({
        method: "POST",
        url: "/routines",
        headers: as(alice),
        payload,
      });
      expect(response.statusCode).toBe(400);
    }
  });

  it("activates one routine at a time and clears it on delete", async () => {
    const first = await createRoutine(alice, "First");
    const second = await createRoutine(alice, "Second");

    const activate = (routineId: string | null) =>
      app.inject({
        method: "PUT",
        url: "/me/active-routine",
        headers: as(alice),
        payload: { routineId },
      });
    const activeNames = async () => {
      const response = await app.inject({
        method: "GET",
        url: "/routines",
        headers: as(alice),
      });
      return response
        .json()
        .filter((r: { isActive: boolean }) => r.isActive)
        .map((r: { name: string }) => r.name);
    };

    expect((await activate(first.id)).statusCode).toBe(204);
    expect(await activeNames()).toEqual(["First"]);

    await activate(second.id);
    expect(await activeNames()).toEqual(["Second"]);

    const removed = await app.inject({
      method: "DELETE",
      url: `/routines/${second.id}`,
      headers: as(alice),
    });
    expect(removed.statusCode).toBe(204);
    expect(await activeNames()).toEqual([]);

    await activate(first.id);
    expect((await activate(null)).statusCode).toBe(204);
    expect(await activeNames()).toEqual([]);
  });
});

describe("CORS", () => {
  const app = buildApp(
    loadEnv({
      ...process.env,
      NODE_ENV: "test",
      CORS_ORIGIN: "http://localhost:8081",
    }),
  );
  afterAll(() => app.close());

  // Browsers preflight PUT/DELETE; the app needs them for routines.
  it.each(["PUT", "DELETE"])("allows %s from the web app", async (method) => {
    const response = await app.inject({
      method: "OPTIONS",
      url: "/routines/any",
      headers: {
        origin: "http://localhost:8081",
        "access-control-request-method": method,
      },
    });
    expect(response.headers["access-control-allow-methods"]).toContain(method);
  });
});
