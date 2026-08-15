import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";

// ================= RECORD POST SHARE =================

export const recordPostShare = async (postId: string): Promise<void> => {
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  try {
    const cookies = authClient.getCookie();
    const response = await fetch(`${API_BASE_URL}/api/v1/shares`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
      body: JSON.stringify({
        postId,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to record post share";

      try {
        const errorData = await response.json();

        if (
          errorData &&
          typeof errorData.error === "string" &&
          errorData.error.trim()
        ) {
          errorMessage = errorData.error;
        }
      } catch {
        // Ignore malformed/non-JSON error responses.
      }

      throw new Error(errorMessage);
    }

    const result: unknown = await response.json();

    // Validate the expected backend response.
    if (
      !result ||
      typeof result !== "object" ||
      !("success" in result) ||
      !("didShare" in result) ||
      typeof result.success !== "boolean" ||
      typeof result.didShare !== "boolean"
    ) {
      throw new Error("Invalid share tracking response");
    }
  } catch (error) {
    // Share tracking is best-effort. The user has already been
    // handed off to the external social platform, so tracking
    // failure should not make the social share appear to fail.
    console.error("[PostDetail] Record share error:", error);
  }
};
