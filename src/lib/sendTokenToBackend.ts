import { authClient } from "@/lib/auth-client";
import { Platform } from "react-native";

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

// 🛡️ Safe backend call with proper error handling
export async function sendTokenToBackend(token: string): Promise<boolean> {
  const cookies = authClient.getCookie();

  if (!backendUrl) {
    console.warn("⚠️ Missing backend URL");
    return false;
  }

  try {
    const response = await fetch(`${backendUrl}/api/v1/push/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `❌ Token registration failed: ${response.status} ${response.statusText}`,
        text,
      );
      return false;
    }

    console.log("✅ Token registered successfully");
    return true;
  } catch (err) {
    console.error("❌ Failed to register token", err);
    return false;
  }
}
