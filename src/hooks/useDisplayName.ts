import { useMemo } from "react";
import { useAuth } from "./useAuth";

export const useDisplayName = () => {
  const { user } = useAuth();

  return useMemo(() => {
    const name = user?.name?.trim();

    if (name) {
      return name;
    }

    if (user?.email) {
      return user.email.split("@")[0];
    }

    return "User";
  }, [user?.name, user?.email]);
};
