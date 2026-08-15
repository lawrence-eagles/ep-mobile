import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { FeedResponse, Post } from "@/types";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

type Ctx = {
  postId: string;
};

// ==============================
// HOOK
// ==============================
export const useForYouFeedMutations = () => {
  const queryClient = useQueryClient();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  // ==============================
  // HELPER: update only target post
  // ==============================
  const updatePost = (
    old: InfiniteData<FeedResponse> | undefined,
    postId: string,
    updater: (post: Post) => Post,
  ): InfiniteData<FeedResponse> | undefined => {
    if (!old) return old;

    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((p) => (p.id === postId ? updater(p) : p)),
      })),
    };
  };

  // ==============================
  // COMMON INVALIDATION
  // ==============================
  const invalidateFeed = () => {
    queryClient.invalidateQueries({ queryKey: ["forYouFeed"] });
  };

  // ==============================
  // LIKE
  // ==============================
  const likeMutation = useMutation<void, Error, string, Ctx>({
    mutationFn: async (postId) => {
      const cookies = authClient.getCookie();
      const res = await fetch(`${API_BASE_URL}/api/v1/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) throw new Error("Like failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, postId, (p) =>
            p.isLiked
              ? p
              : { ...p, isLiked: true, likesCount: p.likesCount + 1 },
          ),
      );

      return { postId };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, ctx.postId, (p) =>
            p.isLiked
              ? {
                  ...p,
                  isLiked: false,
                  likesCount: Math.max(p.likesCount - 1, 0),
                }
              : p,
          ),
      );
    },

    onSettled: invalidateFeed,
  });

  // ==============================
  // UNLIKE
  // ==============================
  const unlikeMutation = useMutation<void, Error, string, Ctx>({
    mutationFn: async (postId) => {
      const cookies = authClient.getCookie();
      const res = await fetch(`${API_BASE_URL}/api/v1/likes/${postId}`, {
        method: "DELETE",
        headers: {
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
      });

      if (!res.ok) throw new Error("Unlike failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, postId, (p) =>
            !p.isLiked
              ? p
              : {
                  ...p,
                  isLiked: false,
                  likesCount: Math.max(p.likesCount - 1, 0),
                },
          ),
      );

      return { postId };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, ctx.postId, (p) =>
            !p.isLiked
              ? { ...p, isLiked: true, likesCount: p.likesCount + 1 }
              : p,
          ),
      );
    },

    onSettled: invalidateFeed,
  });

  // ==============================
  // BOOKMARK
  // ==============================
  const bookmarkMutation = useMutation<void, Error, string, Ctx>({
    mutationFn: async (postId) => {
      const cookies = authClient.getCookie();
      const res = await fetch(`${API_BASE_URL}/api/v1/bookmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) throw new Error("Bookmark failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, postId, (p) =>
            p.isBookmarked ? p : { ...p, isBookmarked: true },
          ),
      );

      return { postId };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, ctx.postId, (p) =>
            p.isBookmarked ? { ...p, isBookmarked: false } : p,
          ),
      );
    },

    onSettled: invalidateFeed,
  });

  // ==============================
  // UNBOOKMARK
  // ==============================
  const unbookmarkMutation = useMutation<void, Error, string, Ctx>({
    mutationFn: async (postId) => {
      const cookies = authClient.getCookie();
      const res = await fetch(`${API_BASE_URL}/api/v1/bookmarks/${postId}`, {
        method: "DELETE",
        headers: {
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
      });

      if (!res.ok) throw new Error("Unbookmark failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, postId, (p) =>
            !p.isBookmarked ? p : { ...p, isBookmarked: false },
          ),
      );

      return { postId };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;

      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["forYouFeed"],
        (old) =>
          updatePost(old, ctx.postId, (p) =>
            !p.isBookmarked ? { ...p, isBookmarked: true } : p,
          ),
      );
    },

    onSettled: invalidateFeed,
  });

  return {
    likeMutation,
    unlikeMutation,
    bookmarkMutation,
    unbookmarkMutation,
  };
};
