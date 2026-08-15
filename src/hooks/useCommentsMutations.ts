import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { commentFeedResponse } from "@/types";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// ================= TYPES =================

type CommentsInfiniteData = InfiniteData<commentFeedResponse>;

interface MutationContext {
  prev?: CommentsInfiniteData;
}

// ================= HELPER =================

const updateCommentLikeState = (
  data: CommentsInfiniteData,
  commentId: string,
  isLiked: boolean,
): CommentsInfiniteData => {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      comments: page.comments.map((c) => {
        // Top-level comment
        if (c.id === commentId) {
          return {
            ...c,
            isLiked,
            likesCount: isLiked
              ? c.likesCount + 1
              : Math.max(0, c.likesCount - 1),
          };
        }

        // Replies
        return {
          ...c,
          replies:
            c.replies?.map((r) =>
              r.id === commentId
                ? {
                    ...r,
                    isLiked,
                    likesCount: isLiked
                      ? r.likesCount + 1
                      : Math.max(0, r.likesCount - 1),
                  }
                : r,
            ) ?? [],
        };
      }),
    })),
  };
};

// ================= HOOK =================

export const useCommentsMutations = (postId: string) => {
  const cookies = authClient.getCookie();
  const queryClient = useQueryClient();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  const queryKey = ["comments", postId];

  // ================= LIKE =================

  const likeMutation = useMutation<void, Error, string, MutationContext>({
    mutationFn: async (commentId) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/comment-likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
        body: JSON.stringify({ commentId }),
      });

      if (!res.ok) {
        throw new Error("Failed to like comment");
      }

      return res.json().catch(() => undefined);
    },

    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });

      const prev = queryClient.getQueryData<CommentsInfiniteData>(queryKey);

      if (prev) {
        queryClient.setQueryData<CommentsInfiniteData>(queryKey, (old) =>
          old ? updateCommentLikeState(old, commentId, true) : old,
        );
      }

      return { prev };
    },

    onError: (_err, _commentId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKey, ctx.prev);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ================= UNLIKE =================

  const unlikeMutation = useMutation<void, Error, string, MutationContext>({
    mutationFn: async (commentId) => {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/comment-likes/${commentId}`,
        {
          method: "DELETE",
          headers: {
            ...(cookies ? { Cookie: cookies } : {}),
          },
          credentials: "omit",
        },
      );

      if (!res.ok) {
        throw new Error("Failed to unlike comment");
      }

      return res.json().catch(() => undefined);
    },

    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });

      const prev = queryClient.getQueryData<CommentsInfiniteData>(queryKey);

      if (prev) {
        queryClient.setQueryData<CommentsInfiniteData>(queryKey, (old) =>
          old ? updateCommentLikeState(old, commentId, false) : old,
        );
      }

      return { prev };
    },

    onError: (_err, _commentId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKey, ctx.prev);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    likeMutation,
    unlikeMutation,
  };
};
