import type { Equipment, Prisma } from "@pep-fit/db";
import { ExerciseFilterQuerySchema } from "@pep-fit/shared-types";
import type { FastifyInstance } from "fastify";

const WEIGHTED_EQUIPMENT: Equipment[] = [
  "barbell",
  "dumbbell",
  "kettlebells",
  "machine",
  "cable",
  "medicine_ball",
  "e_z_curl_bar",
];

const BODYWEIGHT_EQUIPMENT: Equipment[] = [
  "body_only",
  "bands",
  "foam_roll",
  "exercise_ball",
  "other",
];

export async function exercisesRoutes(fastify: FastifyInstance) {
  fastify.get("/exercises", async (request, reply) => {
    const query = ExerciseFilterQuerySchema.parse(request.query);

    const conditions: Prisma.ExerciseWhereInput[] = [];

    if (query.muscle) {
      conditions.push({
        OR: [
          { primaryMuscle: query.muscle },
          { secondaryMuscles: { has: query.muscle } },
        ],
      });
    }

    if (query.equipment) {
      conditions.push({ equipment: query.equipment });
    }

    if (query.requiresWeight !== undefined) {
      conditions.push({
        equipment: {
          in: query.requiresWeight ? WEIGHTED_EQUIPMENT : BODYWEIGHT_EQUIPMENT,
        },
      });
    }

    const where: Prisma.ExerciseWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    const [items, total] = await Promise.all([
      fastify.prisma.exercise.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      fastify.prisma.exercise.count({ where }),
    ]);

    return reply.send({
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  });

  fastify.get<{ Params: { id: string } }>(
    "/exercises/:id",
    async (request, reply) => {
      const exercise = await fastify.prisma.exercise.findUnique({
        where: { id: request.params.id },
      });

      if (!exercise) {
        return reply
          .status(404)
          .send({ error: "NotFound", message: "Exercise not found" });
      }

      return reply.send(exercise);
    },
  );
}
