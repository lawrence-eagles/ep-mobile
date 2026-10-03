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
    async (
      uri: string,
      fileName: string,
    ): Promise<{ url: string; fileId: string }> => {
      // ------------------------------------------------------
      // AUTHENTICATION
      // ------------------------------------------------------

      /*
       * Perform the authentication check inside the callback,
       * not during hook execution.
       *
       * This prevents the component from crashing while the
       * session is loading or after the user signs out.
       */
      const userId = user?.id;

      if (!userId) {
        throw new Error("You must be signed in to upload a profile image.");
      }

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
      // File.size can be null when the filesystem cannot
      // determine the file size. We reject that case instead
      // of allowing an image with an unknown size to bypass
      // the upload limit.

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

      const finalFileName = safeFileName || `profile-${userId}.jpg`;

      // ------------------------------------------------------
      // UPLOAD TO IMAGEKIT
      // ------------------------------------------------------

      return await new Promise<{
        url: string;
        fileId: string;
      }>((resolve, reject) => {
        const client = imagekit as unknown as ImageKitClient;

        client.upload(
          {
            file: base64,
            fileName: finalFileName,
            folder: `/eaglespress/profile-images/${userId}`,
            useUniqueFileName: true,
            responseFields: ["url", "filePath", "name"], // fileId is returned by default
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

            if (!result?.url || !result?.fileId) {
              reject(
                new Error(
                  "Image upload completed but no image URL or file ID was returned.",
                ),
              );

              return;
            }

            resolve({
              url: result.url,
              fileId: result.fileId,
            });
          },
        );
      });
    },
    [user?.id],
  );
};
