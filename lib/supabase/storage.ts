import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "meal-photos";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const ALLOWED_MEDIA_TYPES = new Set(Object.keys(MIME_TO_EXT));

export function isAllowedImageMediaType(mediaType: string): boolean {
  return ALLOWED_MEDIA_TYPES.has(mediaType);
}

export async function uploadMealPhoto(
  userId: string,
  base64: string,
  mediaType: string
): Promise<string> {
  if (!isAllowedImageMediaType(mediaType)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
  }

  const ext = MIME_TO_EXT[mediaType];
  const path = `${userId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("Image must be smaller than 10 MB.");
  }

  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mediaType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  return path;
}
