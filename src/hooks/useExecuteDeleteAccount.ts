import { useAuth } from "@/hooks/useAuth";
import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";

export const useExecuteDeleteAccount = (
  isDeletingAccount: boolean,
  setIsDeletingAccount: (value: boolean) => void,
) => {
  const { refetch: refetchSession } = useAuth();

  // ==========================================================
  // DELETE ACCOUNT
  // ==========================================================

  return useCallback(async () => {
    if (isDeletingAccount) {
      return;
    }

    try {
      setIsDeletingAccount(true);

      const result = await authClient.deleteUser({
        callbackURL: "/preferences/goodbye",
      });

      if (result.error) {
        throw new Error(
          result.error.message || "Unable to delete your account.",
        );
      }

      // If Better Auth has successfully initiated the
      // deletion/verification flow, take the user to the
      // verification screen.
      router.replace("/preferences/verify-delete-account");
      // await refetchSession(); not needed
    } catch (error) {
      console.error("[profile] DELETE ACCOUNT ERROR:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete your account. Please try again.";

      Alert.alert("Unable to delete account", message);
    } finally {
      setIsDeletingAccount(false);
    }
  }, [isDeletingAccount, setIsDeletingAccount]);
};
