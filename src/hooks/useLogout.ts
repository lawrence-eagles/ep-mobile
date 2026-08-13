import { authClient } from "@/lib/auth-client";
import { useCallback } from "react";
import { Alert } from "react-native";

export const useLogout = (isDeletingAccount: boolean) => {
  const { refetch: refetchSession } = authClient.useSession();
  // ==========================================================
  // LOGOUT
  // ==========================================================

  return useCallback(async () => {
    if (isDeletingAccount) {
      return;
    }

    try {
      const result = await authClient.signOut();

      if (result.error) {
        throw new Error(result.error.message || "Unable to log out.");
      }

      // Let the application's auth guard/session listener determine
      // the correct authentication route.
      await refetchSession();
    } catch (error) {
      console.error("[profile] LOGOUT ERROR:", error);

      Alert.alert(
        "Logout failed",
        error instanceof Error
          ? error.message
          : "Unable to log out. Please try again.",
      );
    }
  }, [authClient, isDeletingAccount, refetchSession]);
};
