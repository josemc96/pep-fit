import type { FastifyError, FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { ZodError } from "zod";

export default fp(async (fastify: FastifyInstance) => {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        error: "ValidationError",
        issues: error.issues,
      });
      return;
    }

    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error(error);
    }

    reply.status(statusCode).send({
      error: statusCode === 500 ? "InternalServerError" : error.name,
      message: statusCode === 500 ? "Something went wrong" : error.message,
    });
  });
});
