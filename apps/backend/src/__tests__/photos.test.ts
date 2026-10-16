import "dotenv/config";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { buildApp } from "../app.js";
import { loadEnv } from "../config/env.js";
import { authAs, dbAvailable, deleteTestUsers } from "./support/db.js";

const TEST_USER_PREFIX = "test_photos_";
vi.mock("@clerk/backend", () => import("./support/clerk-mock.js"));

const env = loadEnv({ ...process.env, NODE_ENV: "test" });
// Needs the database and the local object storage (docker compose).
const storageReachable = env.S3_ENDPOINT
  ? await fetch(env.S3_ENDPOINT).then(
      () => true,
      () => false,
    )
  : false;
if (!storageReachable) {
  console.warn(
    "\n⚠ Object storage not reachable: photo integration tests are SKIPPED." +
      "\n  Start it with `docker compose up -d storage` and set S3_* in .env.\n",
  );
}

// A tiny valid JPEG header is enough: storage doesn't decode images.
const IMAGE = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

describe.skipIf(!dbAvailable || !storageReachable)(
  "progress photos API",
  () => {
    const app = buildApp(env);
    const alice = `${TEST_USER_PREFIX}alice_${Date.now()}`;
    const bob = `${TEST_USER_PREFIX}bob_${Date.now()}`;

    const requestUpload = (user: string) =>
      app.inject({
        method: "POST",
        url: "/progress-photos/uploads",
        headers: authAs(user),
        payload: { contentType: "image/jpeg" },
      });
    const register = (user: string, storageKey: string) =>
      app.inject({
        method: "POST",
        url: "/progress-photos",
        headers: authAs(user),
        payload: { storageKey, takenOn: "2026-10-16", pose: "front" },
      });
    const list = async (user: string) =>
      (
        await app.inject({
          method: "GET",
          url: "/progress-photos",
          headers: authAs(user),
        })
      ).json();

    /** The whole client flow: get a URL, PUT the bytes, register the photo. */
    async function uploadPhoto(user: string) {
      const { uploadUrl, storageKey } = (await requestUpload(user)).json();
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: IMAGE,
      });
      expect(put.ok).toBe(true);
      const registered = await register(user, storageKey);
      expect(registered.statusCode).toBe(201);
      return { storageKey, photo: registered.json() };
    }

    beforeAll(() => app.ready());
    afterAll(async () => {
      // Remove what the tests left in storage, then the users (cascade).
      for (const user of [alice, bob]) {
        for (const photo of await list(user)) {
          await app.inject({
            method: "DELETE",
            url: `/progress-photos/${photo.id}`,
            headers: authAs(user),
          });
        }
      }
      await deleteTestUsers(TEST_USER_PREFIX);
      await app.close();
    });

    it("requires authentication", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/progress-photos",
      });
      expect(response.statusCode).toBe(401);
    });

    it("hands out upload URLs under the user's own prefix", async () => {
      const response = await requestUpload(alice);
      expect(response.statusCode).toBe(201);
      const { storageKey, uploadUrl, expiresAt } = response.json();
      expect(storageKey).toMatch(/^users\/[\w-]+\/photos\/[\w-]+\.jpg$/);
      expect(uploadUrl).toContain("X-Amz-Signature");
      expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it("rejects unsupported image types", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/progress-photos/uploads",
        headers: authAs(alice),
        payload: { contentType: "image/gif" },
      });
      expect(response.statusCode).toBe(400);
    });

    it("uploads, registers and serves a photo through a signed URL", async () => {
      const { photo } = await uploadPhoto(alice);
      expect(photo).toMatchObject({ takenOn: "2026-10-16", pose: "front" });

      const [listed] = await list(alice);
      expect(listed.id).toBe(photo.id);
      const image = await fetch(listed.url);
      expect(image.status).toBe(200);
      expect(new Uint8Array(await image.arrayBuffer())).toEqual(IMAGE);

      // Without the signature the image is not reachable.
      const unsigned = await fetch(listed.url.split("?")[0]);
      expect(unsigned.status).toBe(403);
    });

    it("refuses to register an upload that never arrived", async () => {
      const { storageKey } = (await requestUpload(alice)).json();
      expect((await register(alice, storageKey)).statusCode).toBe(400);
    });

    it("keeps photos private between users", async () => {
      const { storageKey, photo } = await uploadPhoto(alice);

      // Bob can't claim Alice's upload, see it, or delete it.
      expect((await register(bob, storageKey)).statusCode).toBe(400);
      expect(await list(bob)).toEqual([]);
      const deleted = await app.inject({
        method: "DELETE",
        url: `/progress-photos/${photo.id}`,
        headers: authAs(bob),
      });
      expect(deleted.statusCode).toBe(404);
    });

    it("deletes the photo and its image", async () => {
      const { photo } = await uploadPhoto(alice);
      const before = (await list(alice)).find(
        (p: { id: string }) => p.id === photo.id,
      );

      const response = await app.inject({
        method: "DELETE",
        url: `/progress-photos/${photo.id}`,
        headers: authAs(alice),
      });
      expect(response.statusCode).toBe(204);
      expect(
        (await list(alice)).some((p: { id: string }) => p.id === photo.id),
      ).toBe(false);
      // The image is gone from storage too.
      expect((await fetch(before.url)).status).toBe(404);
    });
  },
);
