import { createClerkClient, verifyToken } from "@clerk/backend";
import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    clerk: ReturnType<typeof createClerkClient>;
    requireAuth: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
  interface FastifyRequest {
    clerkUserId: string;
  }
}

interface AuthPluginOptions {
  clerkSecretKey: string;
}

export default fp<AuthPluginOptions>(async (fastify, opts) => {
  const clerk = createClerkClient({ secretKey: opts.clerkSecretKey });

  fastify.decorate("clerk", clerk);
  fastify.decorateRequest("clerkUserId", "");

  fastify.decorate(
    "requireAuth",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : undefined;

      if (!token) {
        return reply
          .status(401)
          .send({ error: "Unauthorized", message: "Missing bearer token" });
      }

      try {
        const payload = await verifyToken(token, {
          secretKey: opts.clerkSecretKey,
        });
        request.clerkUserId = payload.sub;
      } catch {
        return reply
          .status(401)
          .send({ error: "Unauthorized", message: "Invalid token" });
      }
    },
  );
});
