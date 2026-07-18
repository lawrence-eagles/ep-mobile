import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const { data, isPending, error } = authClient.useSession();

  const user = data?.user ?? null;

  return {
    user,
    isAuthenticated: !isPending && !!user, // ✅ FIXED
    isLoading: isPending,
    isError: !!error,
    error,
  };
}
