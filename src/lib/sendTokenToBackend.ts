import { Platform } from "react-native";

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

// 🛡️ Safe backend call
export async function sendTokenToBackend(token: string) {
  if (!backendUrl) {
    console.warn("⚠️ Missing backend URL");
    return;
  }

  try {
    await fetch(`${backendUrl}/api/push/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    });
  } catch (err) {
    console.error("❌ Failed to register token", err);
  }
}
