import { z } from "zod";
import type { FastifyInstance } from "fastify";

import { findOrCreateUser } from "../users/users.service.js";

const ActiveRoutineBodySchema = z.object({
  routineId: z.string().uuid().nullable(),
});

export async function meRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/me",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const { user, created } = await findOrCreateUser(
        fastify,
        request.clerkUserId,
      );
      return reply.status(created ? 201 : 200).send(user);
    },
  );

  /** Sets (or clears, with `null`) the routine the user is following. */
  fastify.put(
    "/me/active-routine",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const { routineId } = ActiveRoutineBodySchema.parse(request.body);
      const { user } = await findOrCreateUser(fastify, request.clerkUserId);

      if (routineId) {
        const owned = await fastify.prisma.routine.count({
          where: { id: routineId, userId: user.id },
        });
        if (owned === 0) {
          return reply
            .status(404)
            .send({ error: "NotFound", message: "Routine not found" });
        }
      }

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { activeRoutineId: routineId },
      });
      return reply.status(204).send();
    },
  );
}
