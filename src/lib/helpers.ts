import type {
  BlockedUser,
  BlockedUsersResponse,
  UnblockUserResponse,
} from "@/types";
// Adjust this import to your actual Better Auth client location.
import { authClient } from "@/lib/auth-client";

// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").replace(
  /\/+$/,
  "",
);

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

// ============================================================
// BLOCK USERS API HELPERS
// ============================================================

/**
 * Parse an API response safely.
 */
async function parseResponse<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Get authenticated request headers.
 */
async function getAuthenticatedHeaders(): Promise<HeadersInit> {
  const cookies = await authClient.getCookie();

  if (!cookies) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return {
    Cookie: cookies,
    Accept: "application/json",
  };
}

// ============================================================
// FETCH BLOCKED USERS
// ============================================================

/**
 * Retrieve users blocked by the authenticated user.
 */
export async function fetchBlockedUsers(): Promise<BlockedUser[]> {
  if (!API_BASE_URL) {
    throw new Error("Backend URL is not configured.");
  }

  const headers = await getAuthenticatedHeaders();

  const response = await fetch(`${API_BASE_URL}/api/v1/users/blocked`, {
    method: "GET",
    headers,
    credentials: "omit",
  });

  const responseData = await parseResponse<BlockedUsersResponse>(response);

  if (!response.ok || responseData?.success !== true) {
    throw new Error(
      responseData?.message ||
        responseData?.error ||
        `Failed to retrieve blocked users. Server returned ${response.status}.`,
    );
  }

  if (!Array.isArray(responseData.data)) {
    throw new Error("Invalid blocked users response from server.");
  }

  return responseData.data;
}

// ============================================================
// UNBLOCK USER API
// ============================================================

/**
 * Unblock a previously blocked user.
 */
export async function unblockUserRequest(
  targetUserId: string,
): Promise<UnblockUserResponse> {
  if (!targetUserId?.trim()) {
    throw new Error("Invalid user ID.");
  }

  if (!API_BASE_URL) {
    throw new Error("Backend URL is not configured.");
  }

  const headers = await getAuthenticatedHeaders();

  const response = await fetch(
    `${API_BASE_URL}/api/v1/users/${encodeURIComponent(targetUserId)}/block`,
    {
      method: "DELETE",
      headers,
      credentials: "omit",
    },
  );

  const responseData = await parseResponse<UnblockUserResponse>(response);

  if (!response.ok || responseData?.success !== true) {
    throw new Error(
      responseData?.message ||
        responseData?.error ||
        `Failed to unblock user. Server returned ${response.status}.`,
    );
  }

  return responseData;
}
