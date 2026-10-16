import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().min(1).default("*"),
  CLERK_SECRET_KEY: z.string().min(1),

  // S3-compatible storage for progress photos: RustFS in development,
  // Cloudflare R2 in production. Photos are disabled while unset.
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().min(1).default("auto"),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).optional(),
  // Booleans from env strings: z.coerce.boolean() would read "false" as true.
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  /** Create the bucket and its CORS rules on startup (development). */
  S3_AUTO_SETUP: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment variables:\n${parsed.error.toString()}`,
    );
  }
  return parsed.data;
}
