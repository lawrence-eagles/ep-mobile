import { useAuth } from "@/hooks/useAuth";
import { useUploadProfileImageToImageKit } from "@/hooks/useUploadProfileImageToImageKit";
import { authClient } from "@/lib/auth-client";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useCallback } from "react";
import { Alert } from "react-native";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

// ==========================================================
// PICK PROFILE IMAGE
// ==========================================================

export const useHandleChangeProfileImage = (
  isUploadingImage: boolean,
  setIsUploadingImage: (value: boolean) => void,
) => {
  // --------------------------------------------------------
  // AUTH
  // --------------------------------------------------------

  const { user, refetch: refetchSession } = useAuth();

  // --------------------------------------------------------
  // IMAGEKIT
  // --------------------------------------------------------

  const uploadProfileImageToImageKit = useUploadProfileImageToImageKit();

  // --------------------------------------------------------
  // HANDLE PROFILE IMAGE CHANGE
  // --------------------------------------------------------

  return useCallback(async () => {
    if (isUploadingImage) {
      return;
    }

    try {
      setIsUploadingImage(true);

      // ------------------------------------------------------
      // PHOTO LIBRARY PERMISSION
      // ------------------------------------------------------

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo permission required",
          "Eaglespress needs access to your photos so you can choose a profile image.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Settings",
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch {
                  // Ignore settings-opening errors.
                }
              },
            },
          ],
        );

        return;
      }

      // ------------------------------------------------------
      // IMAGE PICKER
      // ------------------------------------------------------

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        selectionLimit: 1,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      // ------------------------------------------------------
      // VALIDATE URI
      // ------------------------------------------------------

      if (!asset.uri) {
        throw new Error("The selected image is invalid.");
      }

      // ------------------------------------------------------
      // VALIDATE FILE SIZE
      // ------------------------------------------------------

      if (
        asset.fileSize !== undefined &&
        asset.fileSize > MAX_PROFILE_IMAGE_SIZE
      ) {
        Alert.alert(
          "Image too large",
          "Please choose a profile image smaller than 5 MB.",
        );

        return;
      }

      // ------------------------------------------------------
      // VALIDATE MIME TYPE
      // ------------------------------------------------------

      if (asset.mimeType && !asset.mimeType.startsWith("image/")) {
        Alert.alert("Invalid image", "Please choose a valid image file.");

        return;
      }

      // ------------------------------------------------------
      // FILE NAME
      // ------------------------------------------------------

      const fileName =
        asset.fileName || `profile-${user?.id ?? "user"}-${Date.now()}.jpg`;

      // ------------------------------------------------------
      // UPLOAD TO IMAGEKIT
      // ------------------------------------------------------

      const uploadedImageUrl = await uploadProfileImageToImageKit(
        asset.uri,
        fileName,
      );

      // ------------------------------------------------------
      // UPDATE BETTER AUTH
      // ------------------------------------------------------

      const updateResult = await authClient.updateUser({
        image: uploadedImageUrl,
      });

      if (updateResult.error) {
        throw new Error(
          updateResult.error.message || "Unable to update your profile image.",
        );
      }

      // ------------------------------------------------------
      // REFRESH SESSION
      // ------------------------------------------------------

      await refetchSession();

      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      Alert.alert(
        "Profile updated",
        "Your profile image has been updated successfully.",
      );
    } catch (error) {
      console.error("[profile] IMAGE UPDATE ERROR:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to update your profile image. Please try again.";

      Alert.alert("Unable to update image", message);
    } finally {
      setIsUploadingImage(false);
    }
  }, [
    isUploadingImage,
    refetchSession,
    setIsUploadingImage,
    uploadProfileImageToImageKit,
    user?.id,
  ]);
};
