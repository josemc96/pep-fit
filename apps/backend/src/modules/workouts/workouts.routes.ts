import {
  ExerciseLocaleQuerySchema,
  LatestWorkoutQuerySchema,
  PreviousSetsQuerySchema,
  WorkoutInputSchema,
  WorkoutListQuerySchema,
} from "@pep-fit/shared-types";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";

import { findOrCreateUser } from "../users/users.service.js";
import { createWorkoutsService } from "./workouts.service.js";

const WorkoutParamsSchema = z.object({ id: z.string().uuid() });

function notFound(reply: FastifyReply) {
  return reply
    .status(404)
    .send({ error: "NotFound", message: "Workout not found" });
}

/** The signed-in user's workouts; other users' answer 404. */
export async function workoutsRoutes(fastify: FastifyInstance) {
  const workouts = createWorkoutsService(fastify.prisma);

  fastify.addHook("preHandler", fastify.requireAuth);

  async function currentUserId(clerkUserId: string) {
    const { user } = await findOrCreateUser(fastify, clerkUserId);
    return user.id;
  }

  fastify.post("/workouts", async (request, reply) => {
    const input = WorkoutInputSchema.parse(request.body);
    const userId = await currentUserId(request.clerkUserId);

    return reply.status(201).send(await workouts.create(userId, input));
  });

  fastify.get("/workouts", async (request, reply) => {
    const { page, pageSize } = WorkoutListQuerySchema.parse(request.query);
    const userId = await currentUserId(request.clerkUserId);

    return reply.send(await workouts.list(userId, page, pageSize));
  });

  /** `{ workout: null }` when there is none yet. */
  fastify.get("/workouts/latest", async (request, reply) => {
    const { routineId } = LatestWorkoutQuerySchema.parse(request.query);
    const userId = await currentUserId(request.clerkUserId);

    return reply.send({ workout: await workouts.latest(userId, routineId) });
  });

  fastify.get("/workouts/previous-sets", async (request, reply) => {
    const { exerciseIds } = PreviousSetsQuerySchema.parse(request.query);
    const userId = await currentUserId(request.clerkUserId);

    return reply.send({
      items: await workouts.previousSets(userId, exerciseIds),
    });
  });

  fastify.get("/workouts/:id", async (request, reply) => {
    const { id } = WorkoutParamsSchema.parse(request.params);
    const { lang } = ExerciseLocaleQuerySchema.parse(request.query);
    const userId = await currentUserId(request.clerkUserId);

    const workout = await workouts.get(userId, id, lang);
    return workout ? reply.send(workout) : notFound(reply);
  });

  fastify.delete("/workouts/:id", async (request, reply) => {
    const { id } = WorkoutParamsSchema.parse(request.params);
    const userId = await currentUserId(request.clerkUserId);

    const removed = await workouts.remove(userId, id);
    return removed ? reply.status(204).send() : notFound(reply);
  });
}
