import cors from "@fastify/cors";
import Fastify from "fastify";

import type { Env } from "./config/env.js";
import { exercisesRoutes } from "./modules/exercises/exercises.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { meRoutes } from "./modules/me/me.routes.js";
import { routinesRoutes } from "./modules/routines/routines.routes.js";
import authPlugin from "./plugins/auth.js";
import errorHandlerPlugin from "./plugins/error-handler.js";
import prismaPlugin from "./plugins/prisma.js";

export function buildApp(env: Env) {
  const app = Fastify({ logger: env.NODE_ENV !== "test" });

  app.register(cors, {
    origin: env.CORS_ORIGIN,
    // @fastify/cors only allows GET/HEAD/POST by default since v10.
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
  });
  app.register(errorHandlerPlugin);
  app.register(prismaPlugin);
  app.register(authPlugin, { clerkSecretKey: env.CLERK_SECRET_KEY });
  app.register(healthRoutes);
  app.register(meRoutes);
  app.register(exercisesRoutes);
  app.register(routinesRoutes);

  return app;
}
