import { getEnv } from "@/lib/env";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// ==============================
// TYPES
// ==============================
type Category = {
  id: string;
  name: string;
  slug: string;
  isFollowing: boolean;
};

type CategoriesResponse = {
  success: boolean;
  categories: Category[];
};

type Context = { previous?: Category[] };

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // ✅ SAFE env usage (inside hook)
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  // ==============================
  // API FUNCTIONS (NOW SCOPED SAFELY)
  // ==============================
  const fetchCategories = async (): Promise<Category[]> => {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data: CategoriesResponse = await res.json();

    if (!data.success) {
      throw new Error("Invalid response");
    }

    return data.categories;
  };

  const followCategory = async (categoryId: string) => {
    const res = await fetch(`${API_BASE_URL}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ categoryId }),
    });

    if (!res.ok) {
      throw new Error("Follow failed");
    }

    return res.json();
  };

  const unfollowCategory = async (categoryId: string) => {
    const res = await fetch(`${API_BASE_URL}/unfollow/${categoryId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Unfollow failed");
    }

    return res.json();
  };

  // ==============================
  // FETCH
  // ==============================
  //   const {
  //     data: categories = [],
  //     isLoading,
  //     isError,
  //   } = useQuery({
  //     queryKey: ["categories"],
  //     queryFn: fetchCategories,
  //   });

  const {
    data: categories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5, // 5 mins
    retry: 2,
  });

  // ==============================
  // FOLLOW MUTATION
  // ==============================
  const followMutation = useMutation({
    mutationKey: ["followCategory"],
    mutationFn: followCategory,

    onMutate: async (categoryId: string): Promise<Context> => {
      setActiveId(categoryId);

      await queryClient.cancelQueries({ queryKey: ["categories"] });

      const previous = queryClient.getQueryData<Category[]>(["categories"]);

      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) => (c.id === categoryId ? { ...c, isFollowing: true } : c)),
      );

      return { previous };
    },

    // ✅ ADD HERE
    onSuccess: (_data, categoryId) => {
      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) => (c.id === categoryId ? { ...c, isFollowing: true } : c)),
      );
    },

    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["categories"], context.previous);
      }

      const message = getErrorMessage(err);
      console.error("Follow error:", message);
      alert(message);
    },

    onSettled: () => {
      setActiveId(null);
    },
  });

  // ==============================
  // UNFOLLOW MUTATION
  // ==============================
  const unfollowMutation = useMutation({
    mutationKey: ["unfollowCategory"],
    mutationFn: unfollowCategory,

    onMutate: async (categoryId: string): Promise<Context> => {
      setActiveId(categoryId);

      await queryClient.cancelQueries({ queryKey: ["categories"] });

      const previous = queryClient.getQueryData<Category[]>(["categories"]);

      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) =>
          c.id === categoryId ? { ...c, isFollowing: false } : c,
        ),
      );

      return { previous };
    },

    // ✅ ADD HERE
    onSuccess: (_data, categoryId) => {
      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) =>
          c.id === categoryId ? { ...c, isFollowing: false } : c,
        ),
      );
    },

    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["categories"], context.previous);
      }

      const message = getErrorMessage(err);
      console.error("Unfollow error:", message);
      alert(message);
    },

    onSettled: () => {
      setActiveId(null);
    },
  });

  return {
    categories,
    isLoading,
    isError,
    activeId,
    followMutation,
    unfollowMutation,

    // ✅ helpful derived state (optional)
    isMutating: followMutation.isPending || unfollowMutation.isPending,
  };
};
