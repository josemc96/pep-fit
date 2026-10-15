import "dotenv/config";

import { ROUTINE_LIMITS, RoutineInputSchema } from "@pep-fit/shared-types";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { buildApp } from "../app.js";
import { loadEnv } from "../config/env.js";
import { ROUTINE_TEMPLATES } from "../modules/templates/templates.data.js";
import { authAs, dbAvailable, deleteTestUsers } from "./support/db.js";

const TEST_USER_PREFIX = "test_templates_";
vi.mock("@clerk/backend", () => import("./support/clerk-mock.js"));

describe("routine template catalog", () => {
  it("has unique ids", () => {
    const ids = ROUTINE_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ROUTINE_TEMPLATES.map((t) => [t.id, t] as const))(
    "%s fits the routine limits",
    (_id, template) => {
      expect(template.days.length).toBeGreaterThan(0);
      expect(template.days.length).toBeLessThanOrEqual(ROUTINE_LIMITS.maxDays);
      expect(template.daysPerWeek).toBeGreaterThanOrEqual(1);
      expect(template.daysPerWeek).toBeLessThanOrEqual(7);
      for (const day of template.days) {
        expect(day.name.es && day.name.en).toBeTruthy();
        expect(day.exercises.length).toBeGreaterThan(0);
        expect(day.exercises.length).toBeLessThanOrEqual(
          ROUTINE_LIMITS.maxExercisesPerDay,
        );
        for (const exercise of day.exercises) {
          expect(exercise.sets).toBeGreaterThanOrEqual(1);
          expect(exercise.sets).toBeLessThanOrEqual(
            ROUTINE_LIMITS.maxSetsPerExercise,
          );
          expect(exercise.reps).toBeGreaterThanOrEqual(1);
          expect(exercise.reps).toBeLessThanOrEqual(ROUTINE_LIMITS.maxReps);
        }
      }
    },
  );
});

describe.skipIf(!dbAvailable)("routine templates API", () => {
  const app = buildApp(loadEnv({ ...process.env, NODE_ENV: "test" }));
  const alice = `${TEST_USER_PREFIX}alice_${Date.now()}`;

  const get = (url: string) => app.inject({ method: "GET", url });
  const copy = (id: string, payload: object = {}, lang = "es") =>
    app.inject({
      method: "POST",
      url: `/routine-templates/${id}/copy?lang=${lang}`,
      headers: authAs(alice),
      payload,
    });

  beforeAll(() => app.ready());
  afterAll(async () => {
    await deleteTestUsers(TEST_USER_PREFIX);
    await app.close();
  });

  it("lists the catalog in the requested language", async () => {
    const es = (await get("/routine-templates?lang=es")).json();
    const en = (await get("/routine-templates?lang=en")).json();
    expect(es).toHaveLength(ROUTINE_TEMPLATES.length);
    expect(
      es.find((t: { id: string }) => t.id === "upper-lower"),
    ).toMatchObject({
      name: "Torso / Pierna",
      daysPerWeek: 4,
      dayCount: 4,
      level: "intermediate",
      equipment: "gym",
    });
    expect(en.find((t: { id: string }) => t.id === "upper-lower").name).toBe(
      "Upper / Lower",
    );
  });

  // Also proves every exercise referenced by the catalog exists in the DB.
  it.each(ROUTINE_TEMPLATES.map((t) => t.id))(
    "shows the %s template with localized exercises",
    async (id) => {
      const response = await get(`/routine-templates/${id}?lang=es`);
      expect(response.statusCode).toBe(200);
      const exercise = response.json().days[0].exercises[0];
      expect(exercise.exercise.id).toBeTruthy();
      expect(exercise.sets).toBeGreaterThan(0);
    },
  );

  it("answers 404 for an unknown template", async () => {
    expect((await get("/routine-templates/nope?lang=es")).statusCode).toBe(404);
    expect((await copy("nope")).statusCode).toBe(404);
  });

  it("requires sign-in to copy", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/routine-templates/upper-lower/copy",
      payload: {},
    });
    expect(response.statusCode).toBe(401);
  });

  it("copies a template into the user's routines and follows it", async () => {
    const response = await copy("strength-5x5");
    expect(response.statusCode).toBe(201);

    const routine = response.json();
    expect(routine).toMatchObject({
      name: "Fuerza 5×5",
      isActive: true,
      sourceTemplateId: "strength-5x5",
      days: [{ name: "Entreno A" }, { name: "Entreno B" }],
    });
    expect(routine.days[0].exercises[0].sets).toEqual(
      Array.from({ length: 5 }, () =>
        expect.objectContaining({ targetReps: 5, targetWeightKg: null }),
      ),
    );
  });

  it("can copy without following, keeping the current routine", async () => {
    const response = await copy("full-body-home", { activate: false });
    expect(response.json().isActive).toBe(false);

    const list = await app.inject({
      method: "GET",
      url: "/routines",
      headers: authAs(alice),
    });
    const active = list.json().filter((r: { isActive: boolean }) => r.isActive);
    expect(active.map((r: { name: string }) => r.name)).toEqual(["Fuerza 5×5"]);
  });

  it("makes an independent copy: editing it never changes the template", async () => {
    const routine = (await copy("express-30", { activate: false })).json();
    const edited = RoutineInputSchema.parse({
      name: "Mi express",
      days: [
        {
          name: "Solo uno",
          exercises: [
            {
              exerciseId: routine.days[0].exercises[0].exerciseId,
              restSeconds: 30,
              sets: [{ targetReps: 20, targetWeightKg: 40 }],
            },
          ],
        },
      ],
    });
    const put = await app.inject({
      method: "PUT",
      url: `/routines/${routine.id}`,
      headers: authAs(alice),
      payload: edited,
    });
    expect(put.statusCode).toBe(200);

    const template = (
      await get("/routine-templates/express-30?lang=es")
    ).json();
    expect(template.name).toBe("Express 30 minutos");
    expect(template.days).toHaveLength(2);
    expect(template.days[0].exercises[0]).toMatchObject({ sets: 3, reps: 8 });
  });
});
