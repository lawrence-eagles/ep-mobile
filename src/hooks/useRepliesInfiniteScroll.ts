import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { Reply } from "@/types";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

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

interface UseRepliesInfiniteScrollOptions {
  /**
   * Enable fetching only when the user needs another page
   * beyond the replies already embedded in the root comment.
   */
  enabled?: boolean;

  /**
   * Cursor supplied by the root comment response.
   * This should point to the next page after the embedded replies.
   */
  initialCursor?: string | null;
}

// ================= HOOK =================

export const useRepliesInfiniteScroll = (
  postId: string,
  parentId: string,
  options: UseRepliesInfiniteScrollOptions = {},
) => {
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  const { enabled = false, initialCursor = null } = options;

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

    // Identifies the parent whose replies are requested.
    url.searchParams.set("parentId", parentId);

    // Identifies the next page of replies.
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
    InfiniteData<RepliesPageResponse, string | null>,
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

    // Start after the replies already embedded in the root response.
    initialPageParam: initialCursor,

    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : null,

    // Do not fetch on CommentItem mount.
    // Fetch only when the caller explicitly enables the query
    // and a valid cursor indicates that another page exists.
    enabled: Boolean(postId && parentId && enabled && initialCursor),
  });

  return query;
};
