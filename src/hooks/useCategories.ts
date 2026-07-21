import { getEnv } from "@/lib/env";
import { Category } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// ==============================
// TYPES
// ==============================
type CategoriesResponse = {
  success: boolean;
  categories: Category[];
};

type Context = {
  categoryId: string;
  previousValue: boolean;
};

// ==============================
// HELPERS
// ==============================
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
};

// ==============================
// HOOK
// ==============================
export const useCategories = () => {
  // ✅ FIX: support multiple concurrent mutations
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  // ==============================
  // API FUNCTIONS
  // ==============================
  const fetchCategories = async (): Promise<Category[]> => {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch categories");

    const data: CategoriesResponse = await res.json();

    if (!data.success) throw new Error("Invalid response");

    return data.categories;
  };

  const followCategory = async (categoryId: string) => {
    const res = await fetch(`${API_BASE_URL}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ categoryId }),
    });

    if (!res.ok) throw new Error("Follow failed");

    return res.json();
  };

  const unfollowCategory = async (categoryId: string) => {
    const res = await fetch(`${API_BASE_URL}/unfollow/${categoryId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Unfollow failed");

    return res.json();
  };

  // ==============================
  // FETCH
  // ==============================
  const {
    data: categories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  // ==============================
  // HELPERS (ACTIVE IDS)
  // ==============================
  const addActive = (id: string) => {
    setActiveIds((prev) => new Set(prev).add(id));
  };

  const removeActive = (id: string) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // ==============================
  // FOLLOW MUTATION
  // ==============================
  const followMutation = useMutation({
    mutationKey: ["followCategory"],
    mutationFn: followCategory,

    onMutate: async (categoryId: string): Promise<Context> => {
      addActive(categoryId);

      await queryClient.cancelQueries({ queryKey: ["categories"] });

      const previous = queryClient.getQueryData<Category[]>(["categories"]);

      const prevValue =
        previous?.find((c) => c.id === categoryId)?.isFollowing ?? false;

      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) => (c.id === categoryId ? { ...c, isFollowing: true } : c)),
      );

      return { categoryId, previousValue: prevValue };
    },

    onError: (err, _id, context) => {
      if (context) {
        queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
          old.map((c) =>
            c.id === context.categoryId
              ? { ...c, isFollowing: context.previousValue }
              : c,
          ),
        );
      }

      const message = getErrorMessage(err);
      console.error("Follow error:", message);
      alert(message);
    },

    onSuccess: (_data, categoryId) => {
      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) => (c.id === categoryId ? { ...c, isFollowing: true } : c)),
      );
    },

    onSettled: (_data, _err, categoryId) => {
      removeActive(categoryId);
    },
  });

  // ==============================
  // UNFOLLOW MUTATION
  // ==============================
  const unfollowMutation = useMutation({
    mutationKey: ["unfollowCategory"],
    mutationFn: unfollowCategory,

    onMutate: async (categoryId: string): Promise<Context> => {
      addActive(categoryId);

      await queryClient.cancelQueries({ queryKey: ["categories"] });

      const previous = queryClient.getQueryData<Category[]>(["categories"]);

      const prevValue =
        previous?.find((c) => c.id === categoryId)?.isFollowing ?? false;

      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) =>
          c.id === categoryId ? { ...c, isFollowing: false } : c,
        ),
      );

      return { categoryId, previousValue: prevValue };
    },

    onError: (err, _id, context) => {
      if (context) {
        queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
          old.map((c) =>
            c.id === context.categoryId
              ? { ...c, isFollowing: context.previousValue }
              : c,
          ),
        );
      }

      const message = getErrorMessage(err);
      console.error("Unfollow error:", message);
      alert(message);
    },

    onSuccess: (_data, categoryId) => {
      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) =>
          c.id === categoryId ? { ...c, isFollowing: false } : c,
        ),
      );
    },

    onSettled: (_data, _err, categoryId) => {
      removeActive(categoryId);
    },
  });

  return {
    categories,
    isLoading,
    isError,

    // ✅ expose set instead of single id
    activeIds,

    followMutation,
    unfollowMutation,

    isMutating: followMutation.isPending || unfollowMutation.isPending,
  };
};
