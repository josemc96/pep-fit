import cors from "@fastify/cors";
import Fastify from "fastify";

import type { Env } from "./config/env.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import errorHandlerPlugin from "./plugins/error-handler.js";
import prismaPlugin from "./plugins/prisma.js";

export function buildApp(env: Env) {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: env.CORS_ORIGIN });
  app.register(errorHandlerPlugin);
  app.register(prismaPlugin);
  app.register(healthRoutes);

  return app;
}
