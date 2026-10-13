import {
  ExerciseLocaleQuerySchema,
  RoutineInputSchema,
} from "@pep-fit/shared-types";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";

import { findOrCreateUser } from "../users/users.service.js";
import { createRoutinesService } from "./routines.service.js";

const RoutineParamsSchema = z.object({ id: z.string().uuid() });

function notFound(reply: FastifyReply) {
  return reply
    .status(404)
    .send({ error: "NotFound", message: "Routine not found" });
}

/**
 * CRUD for the signed-in user's routines. Routines owned by someone else
 * answer 404 (not 403) so their existence isn't leaked.
 */
export async function routinesRoutes(fastify: FastifyInstance) {
  const routines = createRoutinesService(fastify.prisma);

  fastify.addHook("preHandler", fastify.requireAuth);

  async function currentUserId(clerkUserId: string) {
    const { user } = await findOrCreateUser(fastify, clerkUserId);
    return user.id;
  }

  fastify.get("/routines", async (request, reply) => {
    const userId = await currentUserId(request.clerkUserId);
    return reply.send(await routines.list(userId));
  });

  fastify.get("/routines/:id", async (request, reply) => {
    const { id } = RoutineParamsSchema.parse(request.params);
    const { lang } = ExerciseLocaleQuerySchema.parse(request.query);
    const userId = await currentUserId(request.clerkUserId);

    const routine = await routines.get(userId, id, lang);
    return routine ? reply.send(routine) : notFound(reply);
  });

  fastify.post("/routines", async (request, reply) => {
    const input = RoutineInputSchema.parse(request.body);
    const { lang } = ExerciseLocaleQuerySchema.parse(request.query);
    const userId = await currentUserId(request.clerkUserId);

    return reply.status(201).send(await routines.create(userId, input, lang));
  });

  fastify.put("/routines/:id", async (request, reply) => {
    const { id } = RoutineParamsSchema.parse(request.params);
    const input = RoutineInputSchema.parse(request.body);
    const { lang } = ExerciseLocaleQuerySchema.parse(request.query);
    const userId = await currentUserId(request.clerkUserId);

    const routine = await routines.replace(userId, id, input, lang);
    return routine ? reply.send(routine) : notFound(reply);
  });

  fastify.delete("/routines/:id", async (request, reply) => {
    const { id } = RoutineParamsSchema.parse(request.params);
    const userId = await currentUserId(request.clerkUserId);

    const removed = await routines.remove(userId, id);
    return removed ? reply.status(204).send() : notFound(reply);
  });
}
