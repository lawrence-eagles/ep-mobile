import { getEnv } from "@/lib/env";
import { FeedResponse, Post } from "@/types";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const useForYouFeedMutations = () => {
  const queryClient = useQueryClient();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  // ==============================
  // HELPER
  // ==============================
  const updatePost = (
    old: InfiniteData<FeedResponse> | undefined,
    updater: (post: Post) => Post,
  ): InfiniteData<FeedResponse> | undefined => {
    if (!old) return old;

    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map(updater),
      })),
    };
  };

  // ==============================
  // LIKE
  // ==============================
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) throw new Error("Like failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      const previous = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "forYouFeed",
      ]);

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, (p) =>
            p.id === postId
              ? { ...p, isLiked: true, likesCount: p.likesCount + 1 }
              : p,
          ),
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["forYouFeed"], ctx.previous);
      }
    },
  });

  // ==============================
  // UNLIKE
  // ==============================
  const unlikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/unlike/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Unlike failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      const previous = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "forYouFeed",
      ]);

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, (p) =>
            p.id === postId
              ? {
                  ...p,
                  isLiked: false,
                  likesCount: Math.max(p.likesCount - 1, 0),
                }
              : p,
          ),
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["forYouFeed"], ctx.previous);
      }
    },
  });

  // ==============================
  // BOOKMARK
  // ==============================
  const bookmarkMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) throw new Error("Bookmark failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      const previous = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "forYouFeed",
      ]);

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, (p) =>
            p.id === postId ? { ...p, isBookmarked: true } : p,
          ),
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["forYouFeed"], ctx.previous);
      }
    },
  });

  // ==============================
  // UNBOOKMARK
  // ==============================
  const unbookmarkMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/unbookmark/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Unbookmark failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      const previous = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "forYouFeed",
      ]);

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, (p) =>
            p.id === postId ? { ...p, isBookmarked: false } : p,
          ),
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["forYouFeed"], ctx.previous);
      }
    },
  });

  return {
    likeMutation,
    unlikeMutation,
    bookmarkMutation,
    unbookmarkMutation,
  };
};
