import { useMemo } from "react";
import { useDisplayName } from "./useDisplayName";

export const useInitials = () => {
  const displayName = useDisplayName();
  const initials = useMemo(() => {
    const name = displayName.trim();

    if (!name) {
      return "U";
    }

    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [displayName]);

  return {
    displayName,
    initials,
  };
};
