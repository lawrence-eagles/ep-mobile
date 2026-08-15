import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { commentFeedResponse } from "@/types";
import { useInfiniteQuery } from "@tanstack/react-query";

// ================= TYPES =================

interface FetchCommentsParams {
  pageParam?: string | null;
  postId: string;
  signal?: AbortSignal;
}

// ================= HOOK =================

export const useCommentsInfiniteScroll = (postId: string) => {
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  // ================= API =================

  const fetchComments = async ({
    pageParam,
    postId,
    signal,
  }: FetchCommentsParams): Promise<commentFeedResponse> => {
    const url = new URL(`${API_BASE_URL}/api/v1/comments/${postId}`);

    if (pageParam) {
      url.searchParams.append("cursor", pageParam);
    }

    const cookies = authClient.getCookie();
    const res = await fetch(url.toString(), {
      method: "GET",
      signal,
      headers: {
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch comments");
    }

    return res.json();
  };

  // ================= QUERY =================

  const query = useInfiniteQuery<commentFeedResponse, Error>({
    queryKey: ["comments", postId],

    queryFn: ({ pageParam, signal }) =>
      fetchComments({
        pageParam: pageParam as string | null,
        postId,
        signal,
      }),

    initialPageParam: null, // ✅ REQUIRED in React Query v5

    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,

    enabled: !!postId,
  });

  return query;
};
