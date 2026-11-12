import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { Reply } from "@/types";
import { useInfiniteQuery } from "@tanstack/react-query";

// ================= TYPES =================

interface FetchRepliesParams {
  pageParam: string | null;
  postId: string;
  parentId: string;
  signal?: AbortSignal;
}

export interface RepliesPageResponse {
  parentId: string;
  replies: Reply[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ================= HOOK =================

export const useRepliesInfiniteScroll = (postId: string, parentId: string) => {
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  // ================= API =================

  const fetchReplies = async ({
    pageParam,
    postId,
    parentId,
    signal,
  }: FetchRepliesParams): Promise<RepliesPageResponse> => {
    const url = new URL(
      `${API_BASE_URL}/api/v1/comments/${encodeURIComponent(postId)}`,
    );

    // Required: identifies the parent whose replies are requested.
    url.searchParams.set("parentId", parentId);

    // Optional: identifies the next page of replies.
    if (pageParam) {
      url.searchParams.set("cursor", pageParam);
    }

    // Better Auth cookie authentication.
    const cookies = await authClient.getCookie();

    const res = await fetch(url.toString(), {
      method: "GET",
      signal,
      headers: {
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch replies");
    }

    return (await res.json()) as RepliesPageResponse;
  };

  // ================= QUERY =================

  const query = useInfiniteQuery<
    RepliesPageResponse,
    Error,
    RepliesPageResponse,
    [string, string, string],
    string | null
  >({
    queryKey: ["replies", postId, parentId],

    queryFn: ({ pageParam, signal }) =>
      fetchReplies({
        pageParam,
        postId,
        parentId,
        signal,
      }),

    initialPageParam: null,

    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : null,

    enabled: Boolean(postId && parentId),
  });

  return query;
};
