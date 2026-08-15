// ================= HELPERS =================

import { Alert, Linking } from "react-native";

export function getSafeSlug(param: unknown): string | undefined {
  if (typeof param === "string") return param;

  if (Array.isArray(param) && typeof param[0] === "string") {
    return param[0];
  }

  return undefined;
}

export async function safeOpenURL(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      throw new Error("URL is not supported");
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert("Error", "Unable to open link");
  }
}
