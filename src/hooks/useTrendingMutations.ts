import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { FeedResponse, Post } from "@/types";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const useTrendingMutations = () => {
  const cookies = authClient.getCookie();
  const queryClient = useQueryClient();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  /**
   * =========================
   * HELPERS
   * =========================
   */
  const handleResponse = async (res: Response) => {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res;
  };

  async function likePost(postId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/likes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
      body: JSON.stringify({ postId }),
    });

    return handleResponse(res);
  }

  async function unlikePost(postId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/likes/${postId}`, {
      method: "DELETE",
      headers: {
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
    });

    return handleResponse(res);
  }

  async function bookmarkPost(postId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
      body: JSON.stringify({ postId }),
    });

    return handleResponse(res);
  }

  async function unbookmarkPost(postId: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/bookmarks/${postId}`, {
      method: "DELETE",
      headers: {
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
    });

    return handleResponse(res);
  }

  /**
   * =========================
   * CACHE UPDATE (TARGETED)
   * =========================
   */
  const updatePost = (postId: string, updater: (p: Post) => Post) => {
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

  /**
   * =========================
   * LIKE MUTATION
   * =========================
   */
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

      // Store only the affected post state
      let previousPost: Post | undefined;

      const data = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "trending-feed",
      ]);

      data?.pages.forEach((page) => {
        page.items.forEach((p) => {
          if (p.id === postId) {
            previousPost = p;
          }
        });
      });

      // Optimistic update
      updatePost(postId, (p) => ({
        ...p,
        isLiked: !isLiked,
        likesCount: p.likesCount + (isLiked ? -1 : 1),
      }));

      return { previousPost, postId };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousPost) {
        updatePost(ctx.postId, () => ctx.previousPost!);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trending-feed"] });
    },
  });

  /**
   * =========================
   * BOOKMARK MUTATION
   * =========================
   */
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

      let previousPost: Post | undefined;

      const data = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "trending-feed",
      ]);

      data?.pages.forEach((page) => {
        page.items.forEach((p) => {
          if (p.id === postId) {
            previousPost = p;
          }
        });
      });

      // Optimistic update
      updatePost(postId, (p) => ({
        ...p,
        isBookmarked: !isBookmarked,
      }));

      return { previousPost, postId };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousPost) {
        updatePost(ctx.postId, () => ctx.previousPost!);
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
