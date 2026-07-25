import { getEnv } from "@/lib/env";
import { FeedResponse, Post } from "@/types";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const useTrendingMutations = () => {
  const queryClient = useQueryClient();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  async function likePost(postId: string) {
    await fetch(`${API_BASE_URL}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId }),
    });
  }

  async function unlikePost(postId: string) {
    await fetch(`${API_BASE_URL}/unlike/${postId}`, {
      method: "DELETE",
      credentials: "include",
    });
  }

  async function bookmarkPost(postId: string) {
    await fetch(`${API_BASE_URL}/bookmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId }),
    });
  }

  async function unbookmarkPost(postId: string) {
    await fetch(`${API_BASE_URL}/bookmark/${postId}`, {
      method: "DELETE",
      credentials: "include",
    });
  }

  /**
   * =========================
   * MUTATIONS (OPTIMISTIC)
   * =========================
   */
  const updateCache = (postId: string, updater: (p: Post) => Post) => {
    queryClient.setQueryData<InfiniteData<FeedResponse>>(
      ["trending-feed"],
      (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((p) => (p.id === postId ? updater(p) : p)),
          })),
        };
      },
    );
  };

  const likeMutation = useMutation({
    mutationFn: async ({
      postId,
      isLiked,
    }: {
      postId: string;
      isLiked: boolean;
    }) => {
      return isLiked ? unlikePost(postId) : likePost(postId);
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["trending-feed"] });

      const prev = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "trending-feed",
      ]);

      updateCache(postId, (p) => ({
        ...p,
        isLiked: !isLiked,
        likesCount: p.likesCount + (isLiked ? -1 : 1),
      }));

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["trending-feed"], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trending-feed"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({
      postId,
      isBookmarked,
    }: {
      postId: string;
      isBookmarked: boolean;
    }) => {
      return isBookmarked ? unbookmarkPost(postId) : bookmarkPost(postId);
    },
    onMutate: async ({ postId, isBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: ["trending-feed"] });

      const prev = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "trending-feed",
      ]);

      updateCache(postId, (p) => ({
        ...p,
        isBookmarked: !isBookmarked,
      }));

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["trending-feed"], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trending-feed"] });
    },
  });

  return {
    likeMutation,
    bookmarkMutation,
  };
};
