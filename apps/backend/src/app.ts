import cors from "@fastify/cors";
import Fastify from "fastify";

import type { Env } from "./config/env.js";
import { exercisesRoutes } from "./modules/exercises/exercises.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { meRoutes } from "./modules/me/me.routes.js";
import { progressRoutes } from "./modules/progress/progress.routes.js";
import { routinesRoutes } from "./modules/routines/routines.routes.js";
import { templatesRoutes } from "./modules/templates/templates.routes.js";
import { workoutsRoutes } from "./modules/workouts/workouts.routes.js";
import authPlugin from "./plugins/auth.js";
import errorHandlerPlugin from "./plugins/error-handler.js";
import prismaPlugin from "./plugins/prisma.js";

export function buildApp(env: Env) {
  const app = Fastify({ logger: env.NODE_ENV !== "test" });

  app.register(cors, {
    origin: env.CORS_ORIGIN,
    // @fastify/cors only allows GET/HEAD/POST by default since v10.
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
    // The app sends its time zone so weeks are judged in local time.
    allowedHeaders: ["Authorization", "Content-Type", "X-Timezone"],
  });
  app.register(errorHandlerPlugin);
  app.register(prismaPlugin);
  app.register(authPlugin, { clerkSecretKey: env.CLERK_SECRET_KEY });
  app.register(healthRoutes);
  app.register(meRoutes);
  app.register(exercisesRoutes);
  app.register(routinesRoutes);
  app.register(templatesRoutes);
  app.register(workoutsRoutes);
  app.register(progressRoutes);

  return app;
}
