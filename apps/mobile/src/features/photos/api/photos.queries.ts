import {
  PhotoUploadSchema,
  ProgressPhotoSchema,
  type PhotoContentType,
  type PhotoPose,
} from "@pep-fit/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "../../../lib/useApi";

export const photoKeys = { all: ["progress-photos"] as const };

/** Image URLs are signed for 15 minutes, so refresh them well before. */
const PHOTO_LIST_STALE_MS = 10 * 60 * 1000;

export function useProgressPhotosQuery() {
  const api = useApi();
  return useQuery({
    queryKey: photoKeys.all,
    staleTime: PHOTO_LIST_STALE_MS,
    refetchInterval: PHOTO_LIST_STALE_MS,
    queryFn: async () =>
      ProgressPhotoSchema.array().parse(await api<unknown>("/progress-photos")),
  });
}

export type NewPhoto = {
  /** Local URI from the image picker (file://, blob: or data: on web). */
  uri: string;
  contentType: PhotoContentType;
  takenOn: string;
  pose: PhotoPose;
};

/**
 * Uploads in three steps: get a signed URL from the API, PUT the image
 * straight to storage, then register it. The image never goes through the
 * API server.
 */
export function useUploadPhotoMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: NewPhoto) => {
      const upload = PhotoUploadSchema.parse(
        await api<unknown>("/progress-photos/uploads", {
          method: "POST",
          body: JSON.stringify({ contentType: photo.contentType }),
        }),
      );

      const image = await (await fetch(photo.uri)).blob();
      const put = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": photo.contentType },
        body: image,
      });
      if (!put.ok) {
        throw new Error(`Upload failed with status ${put.status}`);
      }

      return ProgressPhotoSchema.parse(
        await api<unknown>("/progress-photos", {
          method: "POST",
          body: JSON.stringify({
            storageKey: upload.storageKey,
            takenOn: photo.takenOn,
            pose: photo.pose,
          }),
        }),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: photoKeys.all }),
  });
}

export function useDeletePhotoMutation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/progress-photos/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: photoKeys.all }),
  });
}
