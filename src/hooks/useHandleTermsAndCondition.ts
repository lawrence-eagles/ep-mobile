import * as Linking from "expo-linking";
import { useCallback } from "react";
import { Alert } from "react-native";

const TERMS_URL = "http://eaglespress.com/terms-and-condition";

export const useHandleTermsAndCondition = () => {
  // ==========================================================
  // TERMS
  // ==========================================================

  return useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(TERMS_URL);

      if (!supported) {
        throw new Error("Unable to open the terms and conditions.");
      }

      await Linking.openURL(TERMS_URL);
    } catch (error) {
      console.error("[profile] TERMS ERROR:", error);

      Alert.alert(
        "Unable to open page",
        "We couldn't open the terms and conditions. Please try again.",
      );
    }
  }, []);
};
