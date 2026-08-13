import * as Linking from "expo-linking";
import * as StoreReview from "expo-store-review";
import { useCallback } from "react";
import { Alert, Platform } from "react-native";

export const useRateApp = (
  isOpeningReview: boolean,
  setIsOpeningReview: (value: boolean) => void,
) => {
  // ==========================================================
  // RATE APP
  // ==========================================================
  return useCallback(async () => {
    if (isOpeningReview) {
      return;
    }

    try {
      setIsOpeningReview(true);

      // Get the platform-specific store URL configured
      // in app.config.js / app.json.
      const storeUrl = await StoreReview.storeUrl();

      if (!storeUrl) {
        throw new Error("Store URL is not configured.");
      }

      let reviewUrl = storeUrl;

      // iOS:
      // Opens the "Write a Review" page directly.
      if (Platform.OS === "ios") {
        reviewUrl = storeUrl.includes("?")
          ? `${storeUrl}&action=write-review`
          : `${storeUrl}?action=write-review`;
      }

      // Android:
      // Opens the Play Store reviews section.
      if (Platform.OS === "android") {
        reviewUrl = storeUrl.includes("?")
          ? `${storeUrl}&showAllReviews=true`
          : `${storeUrl}?showAllReviews=true`;
      }

      // Make sure the device can actually handle the URL
      // before attempting to open it.
      const supported = await Linking.canOpenURL(reviewUrl);

      if (!supported) {
        throw new Error("The app store could not be opened.");
      }

      await Linking.openURL(reviewUrl);
    } catch (error) {
      console.error("[profile] RATE APP ERROR:", error);

      Alert.alert(
        "Unable to open reviews",
        "We couldn't open the store review page. Please try again later.",
      );
    } finally {
      setIsOpeningReview(false);
    }
  }, [isOpeningReview, setIsOpeningReview]);
};
