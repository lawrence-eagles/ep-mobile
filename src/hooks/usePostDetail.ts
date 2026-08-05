import { getEnv } from "@/lib/env";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ================= TYPES =================

interface Post {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  summary: string | null;
  sourceUrl: string;
  category: string | null;
  categoryId: string | null;
  sourceName: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowingCategory: boolean;
}

// ================= HOOK =================

export const usePostDetail = (slug: string) => {
  const queryClient = useQueryClient();
  const { BACKEND_URL } = getEnv();

  const queryKey = ["post", slug];

  // ================= FETCH HELPER =================

  const fetchJSON = async <T>(
    url: string,
    options?: RequestInit,
  ): Promise<T> => {
    const res = await fetch(url, {
      credentials: "include",
      ...options,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Request failed");
    }

    return res.json();
  };

  // ================= API =================

  const fetchPost = (slug: string) =>
    fetchJSON<Post>(`${BACKEND_URL}/posts/${slug}`);

  const likePost = (postId: string) =>
    fetchJSON(`${BACKEND_URL}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });

  const unlikePost = (postId: string) =>
    fetchJSON(`${BACKEND_URL}/unlike/${postId}`, {
      method: "DELETE",
    });

  const bookmarkPost = (postId: string) =>
    fetchJSON(`${BACKEND_URL}/bookmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });

  const unbookmarkPost = (postId: string) =>
    fetchJSON(`${BACKEND_URL}/unbookmark/${postId}`, {
      method: "DELETE",
    });

  const followCategory = (categoryId: string) =>
    fetchJSON(`${BACKEND_URL}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });

  const unfollowCategory = (categoryId: string) =>
    fetchJSON(`${BACKEND_URL}/unfollow/${categoryId}`, {
      method: "DELETE",
    });

  // ================= QUERY =================

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchPost(slug),
    enabled: Boolean(slug),
    retry: 2,
    staleTime: 1000 * 30,
  });

  // ================= CACHE HELPER =================

  const updateCache = (updater: (old: Post) => Post) => {
    queryClient.setQueryData<Post>(queryKey, (old) => {
      if (!old) return old;
      return updater(old);
    });
  };

  // ================= LIKE =================

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

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<Post>(queryKey);

      updateCache((old) => ({
        ...old,
        isLiked: !variables.isLiked,
        likesCount: variables.isLiked ? old.likesCount - 1 : old.likesCount + 1,
      }));

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ================= BOOKMARK =================

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

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<Post>(queryKey);

      updateCache((old) => ({
        ...old,
        isBookmarked: !variables.isBookmarked,
      }));

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ================= FOLLOW =================

  const followMutation = useMutation({
    mutationFn: async ({
      categoryId,
      isFollowing,
    }: {
      categoryId: string;
      isFollowing: boolean;
    }) => {
      return isFollowing
        ? unfollowCategory(categoryId)
        : followCategory(categoryId);
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<Post>(queryKey);

      updateCache((old) => ({
        ...old,
        isFollowingCategory: !variables.isFollowing,
      }));

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ================= SAFE ACTION WRAPPERS =================

  const isLikePending = likeMutation.isPending;
  const isBookmarkPending = bookmarkMutation.isPending;
  const isFollowPending = followMutation.isPending;

  const toggleLike = () => {
    if (!data || isLikePending) return;

    likeMutation.mutate({
      postId: data.id,
      isLiked: data.isLiked,
    });
  };

  const toggleBookmark = () => {
    if (!data || isBookmarkPending) return;

    bookmarkMutation.mutate({
      postId: data.id,
      isBookmarked: data.isBookmarked,
    });
  };

  const toggleFollow = () => {
    if (!data?.categoryId || isFollowPending) return;

    followMutation.mutate({
      categoryId: data.categoryId,
      isFollowing: data.isFollowingCategory,
    });
  };

  // ================= RETURN =================

  return {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,

    // safe actions
    toggleLike,
    toggleBookmark,
    toggleFollow,

    // mutation states (for disabling UI)
    isLikePending,
    isBookmarkPending,
    isFollowPending,

    // raw mutations (if needed)
    likeMutation,
    bookmarkMutation,
    followMutation,
  };
};
