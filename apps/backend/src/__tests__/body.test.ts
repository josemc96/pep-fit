import "dotenv/config";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { buildApp } from "../app.js";
import { loadEnv } from "../config/env.js";
import { authAs, dbAvailable, deleteTestUsers } from "./support/db.js";

const TEST_USER_PREFIX = "test_body_";
vi.mock("@clerk/backend", () => import("./support/clerk-mock.js"));

const empty = {
  weightKg: null,
  bodyFatPct: null,
  waistCm: null,
  hipsCm: null,
  chestCm: null,
  armCm: null,
  thighCm: null,
};

describe.skipIf(!dbAvailable)("body measurements and profile API", () => {
  const app = buildApp(loadEnv({ ...process.env, NODE_ENV: "test" }));
  const alice = `${TEST_USER_PREFIX}alice_${Date.now()}`;
  const bob = `${TEST_USER_PREFIX}bob_${Date.now()}`;

  const put = (user: string, date: string, payload: object) =>
    app.inject({
      method: "PUT",
      url: `/body-measurements/${date}`,
      headers: authAs(user),
      payload,
    });
  const list = async (user: string) =>
    (
      await app.inject({
        method: "GET",
        url: "/body-measurements",
        headers: authAs(user),
      })
    ).json();

  beforeAll(() => app.ready());
  afterAll(async () => {
    await deleteTestUsers(TEST_USER_PREFIX);
    await app.close();
  });

  it("requires authentication", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/body-measurements",
    });
    expect(response.statusCode).toBe(401);
  });

  it("logs entries and lists them newest first", async () => {
    expect(
      (await put(alice, "2026-10-01", { ...empty, weightKg: 80 })).statusCode,
    ).toBe(200);
    await put(alice, "2026-10-08", { ...empty, weightKg: 79.2, waistCm: 84 });

    expect(await list(alice)).toEqual([
      { ...empty, measuredOn: "2026-10-08", weightKg: 79.2, waistCm: 84 },
      { ...empty, measuredOn: "2026-10-01", weightKg: 80 },
    ]);
  });

  it("replaces the entry when the same day is logged again", async () => {
    await put(alice, "2026-10-08", { ...empty, weightKg: 79 });
    const entries = await list(alice);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ weightKg: 79, waistCm: null });
  });

  it("rejects empty entries, typos and bad dates", async () => {
    expect((await put(alice, "2026-10-09", empty)).statusCode).toBe(400);
    expect(
      (await put(alice, "2026-10-09", { ...empty, weightKg: 790 })).statusCode,
    ).toBe(400);
    expect(
      (await put(alice, "09-10-2026", { ...empty, weightKg: 79 })).statusCode,
    ).toBe(400);
  });

  it("keeps each user's body data private", async () => {
    expect(await list(bob)).toEqual([]);
    const response = await app.inject({
      method: "DELETE",
      url: "/body-measurements/2026-10-01",
      headers: authAs(bob),
    });
    expect(response.statusCode).toBe(404);
    expect(await list(alice)).toHaveLength(2);
  });

  it("deletes an entry", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/body-measurements/2026-10-01",
      headers: authAs(alice),
    });
    expect(response.statusCode).toBe(204);
    expect(
      (await list(alice)).map((e: { measuredOn: string }) => e.measuredOn),
    ).toEqual(["2026-10-08"]);
  });

  it("updates editable profile fields, leaving the rest untouched", async () => {
    const patch = (payload: object) =>
      app.inject({
        method: "PATCH",
        url: "/me",
        headers: authAs(alice),
        payload,
      });

    const first = await patch({
      alias: "Pepe",
      goal: "build_muscle",
      targetWeight: 75,
    });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({
      alias: "Pepe",
      goal: "build_muscle",
      targetWeight: 75,
      experienceLevel: null,
    });

    const second = await patch({ experienceLevel: "intermediate" });
    expect(second.json()).toMatchObject({
      alias: "Pepe",
      experienceLevel: "intermediate",
      targetWeight: 75,
    });

    expect((await patch({ alias: "x" })).statusCode).toBe(400); // too short
    expect((await patch({ goal: "be_famous" })).statusCode).toBe(400);
  });
});
