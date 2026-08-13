import * as Linking from "expo-linking";
import { useCallback } from "react";
import { Alert } from "react-native";

const PRIVACY_POLICY_URL = "http://eaglespress.com/privacy-policy";

export const useHandlePrivacyPolicy = () => {
  // ==========================================================
  // PRIVACY POLICY
  // ==========================================================

  return useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(PRIVACY_POLICY_URL);

      if (!supported) {
        throw new Error("Unable to open the privacy policy.");
      }

      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch (error) {
      console.error("[profile] PRIVACY POLICY ERROR:", error);

      Alert.alert(
        "Unable to open page",
        "We couldn't open the privacy policy. Please try again.",
      );
    }
  }, []);
};
