import {
  ExerciseLocaleQuerySchema,
  WeeklyGoalInputSchema,
} from "@pep-fit/shared-types";
import type { FastifyInstance } from "fastify";

import { findOrCreateUser } from "../users/users.service.js";
import { createProgressService, requestTimeZone } from "./progress.service.js";

/** Points, scores, streaks, records and the weekly goal of the signed-in user. */
export async function progressRoutes(fastify: FastifyInstance) {
  const progress = createProgressService(fastify.prisma);

  fastify.addHook("preHandler", fastify.requireAuth);

  async function currentUserId(clerkUserId: string) {
    const { user } = await findOrCreateUser(fastify, clerkUserId);
    return user.id;
  }

  fastify.get("/progress", async (request, reply) => {
    const { lang } = ExerciseLocaleQuerySchema.parse(request.query);
    const userId = await currentUserId(request.clerkUserId);

    return reply.send(
      await progress.get(userId, requestTimeZone(request), lang),
    );
  });

  /** Responds with the updated progress (goal current/next included). */
  fastify.put("/progress/weekly-goal", async (request, reply) => {
    const { daysPerWeek } = WeeklyGoalInputSchema.parse(request.body);
    const { lang } = ExerciseLocaleQuerySchema.parse(request.query);
    const userId = await currentUserId(request.clerkUserId);
    const timeZone = requestTimeZone(request);

    await progress.setWeeklyGoal(userId, daysPerWeek, timeZone);
    return reply.send(await progress.get(userId, timeZone, lang));
  });
}
