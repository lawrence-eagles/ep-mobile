import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { FeedResponse, Post } from "@/types";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";

export const useFollowingMutations = () => {
  const queryClient = useQueryClient();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  const handleResponse = async (res: Response) => {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
  };

  const updatePost = useCallback(
    (postId: string, updater: (p: Post) => Post) => {
      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["following-feed"],
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
    },
    [queryClient],
  );

  const toggleLike = useMutation({
    mutationFn: async ({
      postId,
      isLiked,
    }: {
      postId: string;
      isLiked: boolean;
    }) => {
      const url = isLiked
        ? `${API_BASE_URL}/api/v1/likes/${postId}`
        : `${API_BASE_URL}/api/v1/likes`;
      const cookies = authClient.getCookie();
      const res = await fetch(url, {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
        body: isLiked ? undefined : JSON.stringify({ postId }),
      });
      return handleResponse(res);
    },

    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["following-feed"] });

      let prev: Post | undefined;

      const data = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "following-feed",
      ]);

      data?.pages.forEach((page) => {
        page.items.forEach((p) => {
          if (p.id === postId) prev = p;
        });
      });

      updatePost(postId, (p) => ({
        ...p,
        isLiked: !isLiked,
        likesCount: p.likesCount + (isLiked ? -1 : 1),
      }));

      return { prev, postId };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        updatePost(ctx.postId, () => ctx.prev!);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["following-feed"] });
    },
  });

  const toggleBookmark = useMutation({
    mutationFn: async ({
      postId,
      isBookmarked,
    }: {
      postId: string;
      isBookmarked: boolean;
    }) => {
      const url = isBookmarked
        ? `${API_BASE_URL}/api/v1/bookmarks/${postId}`
        : `${API_BASE_URL}/api/v1/bookmarks`;
      const cookies = authClient.getCookie();
      const res = await fetch(url, {
        method: isBookmarked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
        body: isBookmarked ? undefined : JSON.stringify({ postId }),
      });
      return handleResponse(res);
    },

    onMutate: async ({ postId, isBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: ["following-feed"] });

      let prev: Post | undefined;

      const data = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "following-feed",
      ]);

      data?.pages.forEach((page) => {
        page.items.forEach((p) => {
          if (p.id === postId) prev = p;
        });
      });

      updatePost(postId, (p) => ({
        ...p,
        isBookmarked: !isBookmarked,
      }));

      return { prev, postId };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        updatePost(ctx.postId, () => ctx.prev!);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["following-feed"] });
    },
  });

  return {
    toggleLike,
    toggleBookmark,
  };
};
