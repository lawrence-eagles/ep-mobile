// ================= HELPERS =================

import { Alert, Linking } from "react-native";

// ================= SLUG HELPER =================

export function getSafeSlug(param: unknown): string | undefined {
  if (typeof param === "string") {
    return param;
  }

  if (Array.isArray(param) && typeof param[0] === "string") {
    return param[0];
  }

  return undefined;
}

// ================= SAFE URL OPENER =================

export async function safeOpenURL(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      throw new Error("URL is not supported");
    }

    await Linking.openURL(url);

    return true;
  } catch (error: unknown) {
    console.error("Failed to open URL:", error);

    Alert.alert("Error", "Unable to open link");

    return false;
  }
}
