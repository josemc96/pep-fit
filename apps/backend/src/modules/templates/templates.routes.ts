import {
  CopyTemplateInputSchema,
  ExerciseLocaleQuerySchema,
} from "@pep-fit/shared-types";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";

import { createRoutinesService } from "../routines/routines.service.js";
import { findOrCreateUser } from "../users/users.service.js";
import { createTemplatesService } from "./templates.service.js";

const TemplateParamsSchema = z.object({ id: z.string().min(1) });

function notFound(reply: FastifyReply) {
  return reply
    .status(404)
    .send({ error: "NotFound", message: "Template not found" });
}

/** The routine catalog. Copying requires being signed in; browsing doesn't. */
export async function templatesRoutes(fastify: FastifyInstance) {
  const templates = createTemplatesService(fastify.prisma);
  const routines = createRoutinesService(fastify.prisma);

  fastify.get("/routine-templates", async (request, reply) => {
    const { lang } = ExerciseLocaleQuerySchema.parse(request.query);
    return reply.send(templates.list(lang));
  });

  fastify.get("/routine-templates/:id", async (request, reply) => {
    const { id } = TemplateParamsSchema.parse(request.params);
    const { lang } = ExerciseLocaleQuerySchema.parse(request.query);

    const template = await templates.get(id, lang);
    return template ? reply.send(template) : notFound(reply);
  });

  /** Copies the template into the user's own routines (independent copy). */
  fastify.post(
    "/routine-templates/:id/copy",
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const { id } = TemplateParamsSchema.parse(request.params);
      const { lang } = ExerciseLocaleQuerySchema.parse(request.query);
      const { activate } = CopyTemplateInputSchema.parse(request.body ?? {});

      const input = await templates.toRoutineInput(id, lang);
      if (!input) return notFound(reply);

      const { user } = await findOrCreateUser(fastify, request.clerkUserId);
      const routine = await routines.copy(user.id, input, lang, {
        sourceTemplateId: id,
        activate,
      });
      return reply.status(201).send(routine);
    },
  );
}
