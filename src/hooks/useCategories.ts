import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ==============================
// CONFIG
// ==============================
const API_BASE_URL = "YOUR_API_URL"; // 🔥 replace

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

// ==============================
// API FUNCTIONS
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

export const useCategories = () => {
  const queryClient = useQueryClient();

  // ==============================
  // FETCH (REACT QUERY)
  // ==============================
  const {
    data: categories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // ==============================
  // FOLLOW MUTATION (OPTIMISTIC)
  // ==============================
  const followMutation = useMutation({
    mutationFn: followCategory,

    onMutate: async (categoryId: string) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });

      const previous = queryClient.getQueryData<Category[]>(["categories"]);

      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) => (c.id === categoryId ? { ...c, isFollowing: true } : c)),
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["categories"], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // ==============================
  // UNFOLLOW MUTATION (OPTIMISTIC)
  // ==============================
  const unfollowMutation = useMutation({
    mutationFn: unfollowCategory,

    onMutate: async (categoryId: string) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });

      const previous = queryClient.getQueryData<Category[]>(["categories"]);

      queryClient.setQueryData<Category[]>(["categories"], (old = []) =>
        old.map((c) =>
          c.id === categoryId ? { ...c, isFollowing: false } : c,
        ),
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["categories"], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return {
    categories,
    isLoading,
    isError,
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
  };
};
