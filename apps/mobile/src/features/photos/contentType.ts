import { PHOTO_LIMITS, type PhotoContentType } from "@pep-fit/shared-types";

const BY_EXTENSION: Record<string, PhotoContentType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * The upload content type for a picked image. Pickers don't always report a
 * MIME type (and some report HEIC, which isn't allowed), so fall back to the
 * file extension. Null when the image can't be uploaded.
 */
export function photoContentType(
  mimeType: string | null | undefined,
  uri: string,
): PhotoContentType | null {
  if (
    mimeType &&
    (PHOTO_LIMITS.contentTypes as readonly string[]).includes(mimeType)
  ) {
    return mimeType as PhotoContentType;
  }
  if (mimeType && mimeType.startsWith("image/")) return null;

  const dataUri = /^data:(image\/[\w+.-]+);/.exec(uri)?.[1];
  if (dataUri) return photoContentType(dataUri, "");

  const extension = /\.(\w+)(?:\?.*)?$/.exec(uri)?.[1]?.toLowerCase();
  return extension ? (BY_EXTENSION[extension] ?? null) : null;
}
