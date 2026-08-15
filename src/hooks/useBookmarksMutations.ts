import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { FeedResponse, Post } from "@/types";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";

export const useBookmarksMutations = () => {
  const cookies = authClient.getCookie();
  const queryClient = useQueryClient();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  const handleResponse = async (res: Response): Promise<FeedResponse> => {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
  };

  /* =========================
     CACHE HELPERS
  ========================= */

  const updatePost = useCallback(
    (postId: string, updater: (p: Post) => Post) => {
      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["bookmarks"],
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

  const removePost = useCallback(
    (postId: string) => {
      queryClient.setQueryData<InfiniteData<FeedResponse>>(
        ["bookmarks"],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((p) => p.id !== postId),
            })),
          };
        },
      );
    },
    [queryClient],
  );

  /* =========================
     MUTATIONS
  ========================= */

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify({ postId }),
        credentials: "omit",
      });
      await handleResponse(res);
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });

      updatePost(postId, (p) => ({
        ...p,
        isLiked: true,
        likesCount: p.likesCount + 1,
      }));
    },
    onError: (_, postId) => {
      updatePost(postId, (p) => ({
        ...p,
        isLiked: false,
        likesCount: Math.max(p.likesCount - 1, 0),
      }));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/likes/${postId}`, {
        method: "DELETE",
        headers: {
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
      });
      await handleResponse(res);
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });

      updatePost(postId, (p) => ({
        ...p,
        isLiked: false,
        likesCount: Math.max(p.likesCount - 1, 0),
      }));
    },
    onError: (_, postId) => {
      updatePost(postId, (p) => ({
        ...p,
        isLiked: true,
        likesCount: p.likesCount + 1,
      }));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const bookmarkMutation = useMutation<
    void,
    Error,
    string,
    { previousData?: InfiniteData<FeedResponse> }
  >({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookies ? { Cookie: cookies } : {}),
        },
        body: JSON.stringify({ postId }),
        credentials: "omit",
      });
      await handleResponse(res);
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });

      const previousData = queryClient.getQueryData<InfiniteData<FeedResponse>>(
        ["bookmarks"],
      );

      updatePost(postId, (p) => ({
        ...p,
        isBookmarked: true,
      }));

      return { previousData };
    },

    onError: (_err, _postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["bookmarks"], context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const unbookmarkMutation = useMutation<
    void,
    Error,
    string,
    { previousData?: InfiniteData<FeedResponse> }
  >({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/bookmarks/${postId}`, {
        method: "DELETE",
        headers: {
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
      });
      await handleResponse(res);
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });

      const previousData = queryClient.getQueryData<InfiniteData<FeedResponse>>(
        ["bookmarks"],
      );

      removePost(postId);

      return { previousData };
    },

    onError: (_err, _postId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["bookmarks"], context.previousData);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  return {
    likeMutation,
    unlikeMutation,
    bookmarkMutation,
    unbookmarkMutation,
  };
};
