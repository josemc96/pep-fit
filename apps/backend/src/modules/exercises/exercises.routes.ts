import type { Equipment, Prisma } from "@pep-fit/db";
import {
  ExerciseFilterQuerySchema,
  ExerciseLocaleQuerySchema,
  normalizeForSearch,
} from "@pep-fit/shared-types";
import type { FastifyInstance } from "fastify";

import {
  localizedExerciseInclude,
  toLocalizedExercise,
  withLocalizedName,
} from "./exercises.mapper.js";

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

    // Query through the translation table so results can be ordered by the
    // localized name (Prisma can't order by a filtered one-to-many relation).
    const where: Prisma.ExerciseTranslationWhereInput = {
      locale: query.lang,
      ...(query.search
        ? { searchName: { contains: normalizeForSearch(query.search) } }
        : {}),
      exercise: conditions.length > 0 ? { AND: conditions } : {},
    };

    const [translations, total] = await Promise.all([
      fastify.prisma.exerciseTranslation.findMany({
        where,
        orderBy: [{ name: "asc" }, { exerciseId: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { exercise: true },
      }),
      fastify.prisma.exerciseTranslation.count({ where }),
    ]);

    return reply.send({
      items: translations.map(({ exercise, name }) =>
        withLocalizedName(exercise, name),
      ),
      page: query.page,
      pageSize: query.pageSize,
      total,
    });
  });

  fastify.get<{ Params: { id: string } }>(
    "/exercises/:id",
    async (request, reply) => {
      const { lang } = ExerciseLocaleQuerySchema.parse(request.query);

      const exercise = await fastify.prisma.exercise.findUnique({
        where: { id: request.params.id },
        include: localizedExerciseInclude(lang),
      });

      if (!exercise) {
        return reply
          .status(404)
          .send({ error: "NotFound", message: "Exercise not found" });
      }

      return reply.send(toLocalizedExercise(exercise));
    },
  );
}
