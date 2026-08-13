import { useExecuteDeleteAccount } from "@/hooks/useExecuteDeleteAccount";
import { useCallback } from "react";
import { Alert } from "react-native";

export const useHandleDeleteAccount = (
  isDeletingAccount: boolean,
  setIsDeletingAccount: (value: boolean) => void,
) => {
  const executeDeleteAccount = useExecuteDeleteAccount(
    isDeletingAccount,
    setIsDeletingAccount,
  );

  return useCallback(() => {
    if (isDeletingAccount) {
      return;
    }

    Alert.alert(
      "Delete account?",
      "This permanently deletes your Eaglespress account and its associated data. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            void executeDeleteAccount();
          },
        },
      ],
    );
  }, [executeDeleteAccount, isDeletingAccount]);
};
