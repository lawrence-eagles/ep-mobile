import { useAuth } from "@/hooks/useAuth";
import imagekit from "@/lib/imageKit";
import { ImageKitClient } from "@/types";
import { File } from "expo-file-system";
import { useCallback } from "react";

// ============================================================
// CONSTANTS
// ============================================================

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

// ==========================================================
// IMAGEKIT UPLOAD
// ==========================================================

export const useUploadProfileImageToImageKit = () => {
  const { user } = useAuth();

  return useCallback(
    async (uri: string, fileName: string): Promise<string> => {
      // ------------------------------------------------------
      // CREATE FILE REFERENCE
      // ------------------------------------------------------

      const file = new File(uri);

      if (!file.exists) {
        throw new Error("The selected image could not be accessed.");
      }

      // ------------------------------------------------------
      // VALIDATE FILE SIZE
      // ------------------------------------------------------
      // File.size can be null when the filesystem cannot determine
      // the file size. We reject that case instead of allowing an
      // image with an unknown size to bypass the upload limit.

      if (file.size == null) {
        throw new Error(
          "Unable to determine the selected image size. Please choose another image.",
        );
      }

      if (file.size > MAX_PROFILE_IMAGE_SIZE) {
        throw new Error("Profile images must be smaller than 5 MB.");
      }

      // ------------------------------------------------------
      // READ FILE
      // ------------------------------------------------------

      const base64 = await file.base64();

      if (!base64) {
        throw new Error("Unable to read the selected image.");
      }

      // ------------------------------------------------------
      // SANITIZE FILE NAME
      // ------------------------------------------------------

      const safeFileName = fileName
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/\s+/g, "_");

      const finalFileName = safeFileName || `profile-${user?.id ?? "user"}.jpg`;

      // ------------------------------------------------------
      // UPLOAD TO IMAGEKIT
      // ------------------------------------------------------

      return await new Promise<string>((resolve, reject) => {
        const client = imagekit as unknown as ImageKitClient;

        client.upload(
          {
            file: base64,
            fileName: finalFileName,
            folder: "/eaglespress/profile-images",
            useUniqueFileName: true,
            responseFields: ["url", "filePath", "name"],
          },
          (error, result) => {
            if (error) {
              reject(
                new Error(
                  error.message || "Image upload failed. Please try again.",
                ),
              );
              return;
            }

            if (!result?.url) {
              reject(
                new Error(
                  "Image upload completed but no image URL was returned.",
                ),
              );
              return;
            }

            resolve(result.url);
          },
        );
      });
    },
    [user?.id],
  );
};
