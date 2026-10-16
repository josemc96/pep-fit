import { randomUUID } from "node:crypto";

import {
  CreateProgressPhotoSchema,
  PHOTO_LIMITS,
  PhotoUploadRequestSchema,
  type PhotoContentType,
  type ProgressPhoto,
} from "@pep-fit/shared-types";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";

import type { ObjectStorage } from "../../plugins/storage.js";
import { findOrCreateUser } from "../users/users.service.js";

const PhotoParamsSchema = z.object({ id: z.string().uuid() });

const EXTENSIONS: Record<PhotoContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Every user's photos live under their own prefix. */
const userPrefix = (userId: string) => `users/${userId}/photos/`;

function storageUnavailable(reply: FastifyReply) {
  return reply.status(503).send({
    error: "StorageUnavailable",
    message: "Photo storage is not configured",
  });
}

function badUpload(reply: FastifyReply, message: string) {
  return reply.status(400).send({ error: "InvalidUpload", message });
}

/**
 * Progress photos. Strictly private: each user only ever sees their own, and
 * images are reachable only through short-lived signed URLs. Uploading is
 * two steps so the image goes straight to storage: ask for an upload URL,
 * PUT the image there, then register it.
 */
export async function photosRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAuth);

  async function currentUserId(clerkUserId: string) {
    const { user } = await findOrCreateUser(fastify, clerkUserId);
    return user.id;
  }

  async function toPhoto(
    storage: ObjectStorage,
    row: {
      id: string;
      takenOn: Date;
      pose: ProgressPhoto["pose"];
      storageKey: string;
      createdAt: Date;
    },
  ): Promise<ProgressPhoto> {
    return {
      id: row.id,
      takenOn: row.takenOn.toISOString().slice(0, 10),
      pose: row.pose,
      url: await storage.downloadUrl(row.storageKey),
      createdAt: row.createdAt,
    };
  }

  fastify.post("/progress-photos/uploads", async (request, reply) => {
    const { storage } = fastify;
    if (!storage) return storageUnavailable(reply);

    const { contentType } = PhotoUploadRequestSchema.parse(request.body);
    const userId = await currentUserId(request.clerkUserId);

    const storageKey = `${userPrefix(userId)}${randomUUID()}.${EXTENSIONS[contentType]}`;
    const { url, expiresAt } = await storage.uploadUrl(storageKey, contentType);
    return reply.status(201).send({ uploadUrl: url, storageKey, expiresAt });
  });

  fastify.post("/progress-photos", async (request, reply) => {
    const { storage } = fastify;
    if (!storage) return storageUnavailable(reply);

    const input = CreateProgressPhotoSchema.parse(request.body);
    const userId = await currentUserId(request.clerkUserId);

    // Only keys handed out to this user, and only images that really arrived.
    if (!input.storageKey.startsWith(userPrefix(userId))) {
      return badUpload(reply, "Unknown upload");
    }
    const object = await storage.stat(input.storageKey);
    if (!object) return badUpload(reply, "The image was not uploaded");
    if (
      object.sizeBytes > PHOTO_LIMITS.maxBytes ||
      !(PHOTO_LIMITS.contentTypes as readonly string[]).includes(
        object.contentType,
      )
    ) {
      await storage.remove(input.storageKey);
      return badUpload(reply, "Images must be JPEG, PNG or WebP up to 10 MB");
    }

    const row = await fastify.prisma.progressPhoto.create({
      data: {
        userId,
        takenOn: new Date(`${input.takenOn}T00:00:00.000Z`),
        pose: input.pose,
        storageKey: input.storageKey,
        contentType: object.contentType,
        sizeBytes: object.sizeBytes,
      },
    });
    return reply.status(201).send(await toPhoto(storage, row));
  });

  /** Newest first, each with a fresh signed URL. */
  fastify.get("/progress-photos", async (request, reply) => {
    const { storage } = fastify;
    if (!storage) return storageUnavailable(reply);

    const userId = await currentUserId(request.clerkUserId);
    const rows = await fastify.prisma.progressPhoto.findMany({
      where: { userId },
      orderBy: [{ takenOn: "desc" }, { createdAt: "desc" }],
    });
    return reply.send(
      await Promise.all(rows.map((row) => toPhoto(storage, row))),
    );
  });

  fastify.delete("/progress-photos/:id", async (request, reply) => {
    const { storage } = fastify;
    if (!storage) return storageUnavailable(reply);

    const { id } = PhotoParamsSchema.parse(request.params);
    const userId = await currentUserId(request.clerkUserId);

    const photo = await fastify.prisma.progressPhoto.findFirst({
      where: { id, userId },
    });
    if (!photo) {
      return reply
        .status(404)
        .send({ error: "NotFound", message: "Photo not found" });
    }

    await fastify.prisma.progressPhoto.delete({ where: { id } });
    await storage.remove(photo.storageKey);
    return reply.status(204).send();
  });
}
