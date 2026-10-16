import {
  BODY_METRIC_KEYS,
  BodyMeasurementInputSchema,
  DayKeySchema,
  type BodyMeasurement,
} from "@pep-fit/shared-types";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { findOrCreateUser } from "../users/users.service.js";

const DateParamsSchema = z.object({ date: DayKeySchema });

const toDate = (day: string) => new Date(`${day}T00:00:00.000Z`);
const toDayKey = (date: Date) => date.toISOString().slice(0, 10);

type MeasurementRow = { measuredOn: Date } & Record<
  (typeof BODY_METRIC_KEYS)[number],
  number | null
>;

function toMeasurement(row: MeasurementRow): BodyMeasurement {
  return {
    measuredOn: toDayKey(row.measuredOn),
    ...Object.fromEntries(BODY_METRIC_KEYS.map((key) => [key, row[key]])),
  } as BodyMeasurement;
}

/**
 * The signed-in user's body weight and measurements, one entry per local
 * day. Strictly private: nothing here is ever exposed to other users.
 */
export async function bodyRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAuth);

  async function currentUserId(clerkUserId: string) {
    const { user } = await findOrCreateUser(fastify, clerkUserId);
    return user.id;
  }

  /** All entries, newest first. */
  fastify.get("/body-measurements", async (request, reply) => {
    const userId = await currentUserId(request.clerkUserId);
    const rows = await fastify.prisma.bodyMeasurement.findMany({
      where: { userId },
      orderBy: { measuredOn: "desc" },
    });
    return reply.send(rows.map(toMeasurement));
  });

  /** Creates or replaces the entry for a day. */
  fastify.put("/body-measurements/:date", async (request, reply) => {
    const { date } = DateParamsSchema.parse(request.params);
    const input = BodyMeasurementInputSchema.parse(request.body);
    const userId = await currentUserId(request.clerkUserId);

    const measuredOn = toDate(date);
    const row = await fastify.prisma.bodyMeasurement.upsert({
      where: { userId_measuredOn: { userId, measuredOn } },
      create: { userId, measuredOn, ...input },
      update: input,
    });
    return reply.send(toMeasurement(row));
  });

  fastify.delete("/body-measurements/:date", async (request, reply) => {
    const { date } = DateParamsSchema.parse(request.params);
    const userId = await currentUserId(request.clerkUserId);

    const { count } = await fastify.prisma.bodyMeasurement.deleteMany({
      where: { userId, measuredOn: toDate(date) },
    });
    return count > 0
      ? reply.status(204).send()
      : reply
          .status(404)
          .send({ error: "NotFound", message: "No entry for that day" });
  });
}
