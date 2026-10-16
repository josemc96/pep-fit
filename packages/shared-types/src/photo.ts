import { z } from "zod";

import { DayKeySchema } from "./body.js";

export const PhotoPoseSchema = z.enum(["front", "side", "back", "other"]);
export type PhotoPose = z.infer<typeof PhotoPoseSchema>;

export const PHOTO_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  contentTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

export const PhotoContentTypeSchema = z.enum(PHOTO_LIMITS.contentTypes);
export type PhotoContentType = z.infer<typeof PhotoContentTypeSchema>;

/**
 * Step 1 of an upload: ask for a short-lived URL to PUT the image to. The
 * image goes straight from the device to storage, never through the API.
 */
export const PhotoUploadRequestSchema = z.object({
  contentType: PhotoContentTypeSchema,
});

export const PhotoUploadSchema = z.object({
  uploadUrl: z.string().url(),
  /** Where the image will live; sent back in step 2. */
  storageKey: z.string(),
  expiresAt: z.coerce.date(),
});
export type PhotoUpload = z.infer<typeof PhotoUploadSchema>;

/** Step 2: once uploaded, register the photo. */
export const CreateProgressPhotoSchema = z.object({
  storageKey: z.string().min(1),
  takenOn: DayKeySchema,
  pose: PhotoPoseSchema,
});
export type CreateProgressPhotoInput = z.infer<
  typeof CreateProgressPhotoSchema
>;

export const ProgressPhotoSchema = z.object({
  id: z.string().uuid(),
  takenOn: DayKeySchema,
  pose: PhotoPoseSchema,
  /** Signed, short-lived URL to display the image. */
  url: z.string().url(),
  createdAt: z.coerce.date(),
});
export type ProgressPhoto = z.infer<typeof ProgressPhotoSchema>;
