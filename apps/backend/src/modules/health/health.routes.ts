import type { FastifyInstance } from "fastify";

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (_request, reply) => {
    try {
      await fastify.prisma.$queryRaw`SELECT 1`;
      return reply.send({ status: "ok", db: "connected" });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(503).send({ status: "error", db: "disconnected" });
    }
  });
}
