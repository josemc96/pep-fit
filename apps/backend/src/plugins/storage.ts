import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import type { Env } from "../config/env.js";

/** Signed URLs stay valid this long. */
const UPLOAD_URL_TTL_SECONDS = 5 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 15 * 60;

/**
 * Private object storage (S3 API: RustFS in development, Cloudflare R2 in
 * production). Objects are never public; clients only get short-lived
 * signed URLs.
 */
export type ObjectStorage = {
  uploadUrl(
    key: string,
    contentType: string,
  ): Promise<{ url: string; expiresAt: Date }>;
  downloadUrl(key: string): Promise<string>;
  /** Size and type of an uploaded object, or null if it isn't there. */
  stat(key: string): Promise<{ sizeBytes: number; contentType: string } | null>;
  remove(key: string): Promise<void>;
};

declare module "fastify" {
  interface FastifyInstance {
    /** Null when storage isn't configured: photo features are disabled. */
    storage: ObjectStorage | null;
  }
}

function createStorage(client: S3Client, bucket: string): ObjectStorage {
  return {
    async uploadUrl(key, contentType) {
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: contentType,
        }),
        { expiresIn: UPLOAD_URL_TTL_SECONDS },
      );
      return {
        url,
        expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
      };
    },

    downloadUrl(key) {
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
      );
    },

    async stat(key) {
      try {
        const head = await client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: key }),
        );
        return {
          sizeBytes: head.ContentLength ?? 0,
          contentType: head.ContentType ?? "",
        };
      } catch (error) {
        if ((error as { name?: string }).name === "NotFound") return null;
        throw error;
      }
    },

    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

/** Creates the bucket if missing and lets the web app upload/download. */
async function setUpBucket(client: S3Client, bucket: string, origin: string) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origin.split(",").map((o) => o.trim()),
            AllowedMethods: ["GET", "PUT"],
            AllowedHeaders: ["*"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
}

export default fp<{ env: Env }>(async (fastify: FastifyInstance, { env }) => {
  const { S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET } =
    env;

  if (
    !S3_ENDPOINT ||
    !S3_ACCESS_KEY_ID ||
    !S3_SECRET_ACCESS_KEY ||
    !S3_BUCKET
  ) {
    fastify.log.warn("Object storage not configured: progress photos disabled");
    fastify.decorate("storage", null);
    return;
  }

  const client = new S3Client({
    endpoint: S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });

  if (env.S3_AUTO_SETUP) {
    try {
      await setUpBucket(client, S3_BUCKET, env.CORS_ORIGIN);
    } catch (error) {
      // Don't take the whole API down if local storage isn't running yet.
      fastify.log.error({ err: error }, "Object storage setup failed");
    }
  }

  fastify.decorate("storage", createStorage(client, S3_BUCKET));
  fastify.addHook("onClose", async () => client.destroy());
});
