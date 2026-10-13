import {
  LatestWorkoutQuerySchema,
  WorkoutInputSchema,
} from "@pep-fit/shared-types";
import type { FastifyInstance } from "fastify";

import { findOrCreateUser } from "../users/users.service.js";
import { createWorkoutsService } from "./workouts.service.js";

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

  /** `{ workout: null }` when there is none yet. */
  fastify.get("/workouts/latest", async (request, reply) => {
    const { routineId } = LatestWorkoutQuerySchema.parse(request.query);
    const userId = await currentUserId(request.clerkUserId);

    return reply.send({ workout: await workouts.latest(userId, routineId) });
  });
}
