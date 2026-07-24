import { getEnv } from "@/lib/env";
import { FeedResponse } from "@/types";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

type ToggleType = "like" | "bookmark";

export const useExploreMutations = () => {
  const queryClient = useQueryClient();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  const useToggleMutation = (type: ToggleType, activeCategoryId?: string) => {
    return useMutation({
      mutationFn: async ({
        postId,
        isActive,
      }: {
        postId: string;
        isActive: boolean; // current state (liked/bookmarked)
      }) => {
        let url = "";
        let method: "POST" | "DELETE" = "POST";

        // =========================
        // DETERMINE ACTION
        // =========================
        if (type === "like") {
          if (isActive) {
            // UNLIKE
            url = `${API_BASE_URL}/like/${postId}`;
            method = "DELETE";
          } else {
            // LIKE
            url = `${API_BASE_URL}/like`;
            method = "POST";
          }
        } else {
          if (isActive) {
            // UNBOOKMARK
            url = `${API_BASE_URL}/bookmark/${postId}`;
            method = "DELETE";
          } else {
            // BOOKMARK
            url = `${API_BASE_URL}/bookmark`;
            method = "POST";
          }
        }

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: method === "POST" ? JSON.stringify({ postId }) : undefined,
        });

        if (!res.ok) throw new Error("Action failed");

        return res.json();
      },

      // =========================
      // OPTIMISTIC UPDATE
      // =========================
      onMutate: async ({ postId, isActive }) => {
        await queryClient.cancelQueries({
          queryKey: ["explore-feed", activeCategoryId],
        });

        const previous = queryClient.getQueryData<InfiniteData<FeedResponse>>([
          "explore-feed",
          activeCategoryId,
        ]);

        queryClient.setQueryData<InfiniteData<FeedResponse>>(
          ["explore-feed", activeCategoryId],
          (old) => {
            if (!old) return old;

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((p) => {
                  if (p.id !== postId) return p;

                  // =========================
                  // LIKE / UNLIKE
                  // =========================
                  if (type === "like") {
                    const nextLiked = !isActive;

                    return {
                      ...p,
                      isLiked: nextLiked,
                      likesCount: p.likesCount + (nextLiked ? 1 : -1),
                    };
                  }

                  // =========================
                  // BOOKMARK / UNBOOKMARK
                  // =========================
                  return {
                    ...p,
                    isBookmarked: !isActive,
                  };
                }),
              })),
            };
          },
        );

        return { previous };
      },

      // =========================
      // ROLLBACK ON ERROR
      // =========================
      onError: (_err, _vars, ctx) => {
        if (ctx?.previous) {
          queryClient.setQueryData(
            ["explore-feed", activeCategoryId],
            ctx.previous,
          );
        }
      },

      // =========================
      // REVALIDATE
      // =========================
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: ["explore-feed", activeCategoryId],
        });
      },
    });
  };

  return { useToggleMutation };
};
