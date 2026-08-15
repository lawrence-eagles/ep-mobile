import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { Category } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

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
  version: number;
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
  const cookies = authClient.getCookie();
  // ✅ Track active requests per ID (count, not just membership)
  const [activeCounts, setActiveCounts] = useState<Map<string, number>>(
    new Map(),
  );

  // ✅ Track latest version per ID
  const versionRef = useRef<Map<string, number>>(new Map());

  const queryClient = useQueryClient();

  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  // ==============================
  // ACTIVE HELPERS
  // ==============================
  const incrementActive = (id: string) => {
    setActiveCounts((prev) => {
      const next = new Map(prev);
      next.set(id, (next.get(id) ?? 0) + 1);
      return next;
    });
  };

  const decrementActive = (id: string) => {
    setActiveCounts((prev) => {
      const next = new Map(prev);
      const count = (next.get(id) ?? 1) - 1;

      if (count <= 0) {
        next.delete(id);
      } else {
        next.set(id, count);
      }

      return next;
    });
  };

  const isActive = (id: string) => activeCounts.has(id);

  // ==============================
  // VERSION HELPERS
  // ==============================
  const nextVersion = (id: string) => {
    const current = versionRef.current.get(id) ?? 0;
    const next = current + 1;
    versionRef.current.set(id, next);
    return next;
  };

  const isLatest = (id: string, version: number) => {
    return versionRef.current.get(id) === version;
  };

  // ==============================
  // API FUNCTIONS
  // ==============================
  const fetchCategories = async (): Promise<Category[]> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/categories`, {
      headers: {
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
    });

    if (!res.ok) throw new Error("Failed to fetch categories");

    const data: CategoriesResponse = await res.json();

    if (!data.success) throw new Error("Invalid response");

    return data.categories;
  };

  const followCategory = async (categoryId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/follows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
      body: JSON.stringify({ categoryId }),
    });

    if (!res.ok) throw new Error("Follow failed");

    return res.json();
  };

  const unfollowCategory = async (categoryId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/follows/${categoryId}`, {
      method: "DELETE",
      headers: {
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
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
  // FOLLOW MUTATION
  // ==============================
  const followMutation = useMutation({
    mutationKey: ["followCategory"],
    mutationFn: followCategory,

    onMutate: async (categoryId: string): Promise<Context> => {
      incrementActive(categoryId);

      const version = nextVersion(categoryId);

      await queryClient.cancelQueries({ queryKey: ["categories"] });

      const previous = queryClient.getQueryData<Category[]>(["categories"]);
      const prevValue =
        previous?.find((c) => c.id === categoryId)?.isFollowing ?? false;

      // optimistic update
      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) => (c.id === categoryId ? { ...c, isFollowing: true } : c)),
      );

      return { categoryId, previousValue: prevValue, version };
    },

    onError: (err, _id, context) => {
      if (context && isLatest(context.categoryId, context.version)) {
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

    onSuccess: (_data, categoryId, context) => {
      if (context && isLatest(categoryId, context.version)) {
        queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
          old.map((c) =>
            c.id === categoryId ? { ...c, isFollowing: true } : c,
          ),
        );
      }
    },

    onSettled: (_data, _err, categoryId) => {
      decrementActive(categoryId);
    },
  });

  // ==============================
  // UNFOLLOW MUTATION
  // ==============================
  const unfollowMutation = useMutation({
    mutationKey: ["unfollowCategory"],
    mutationFn: unfollowCategory,

    onMutate: async (categoryId: string): Promise<Context> => {
      incrementActive(categoryId);

      const version = nextVersion(categoryId);

      await queryClient.cancelQueries({ queryKey: ["categories"] });

      const previous = queryClient.getQueryData<Category[]>(["categories"]);
      const prevValue =
        previous?.find((c) => c.id === categoryId)?.isFollowing ?? false;

      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) =>
          c.id === categoryId ? { ...c, isFollowing: false } : c,
        ),
      );

      return { categoryId, previousValue: prevValue, version };
    },

    onError: (err, _id, context) => {
      if (context && isLatest(context.categoryId, context.version)) {
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

    onSuccess: (_data, categoryId, context) => {
      if (context && isLatest(categoryId, context.version)) {
        queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
          old.map((c) =>
            c.id === categoryId ? { ...c, isFollowing: false } : c,
          ),
        );
      }
    },

    onSettled: (_data, _err, categoryId) => {
      decrementActive(categoryId);
    },
  });

  return {
    categories,
    isLoading,
    isError,

    // ✅ expose helper instead of raw Set
    isActive,

    followMutation,
    unfollowMutation,

    isMutating: followMutation.isPending || unfollowMutation.isPending,
  };
};
