import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { FeedResponse } from "@/types";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

export const useFollowingInfiniteScroll = () => {
  const cookies = authClient.getCookie();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  /**
   * Handle fetch responses safely
   */
  const handleResponse = async (res: Response): Promise<FeedResponse> => {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
  };

  /**
   * Fetch following feed with cursor pagination
   * Avoid URLSearchParams (Hermes-safe)
   */
  async function fetchFollowing({
    pageParam,
  }: {
    pageParam: string | null;
  }): Promise<FeedResponse> {
    let url = `${API_BASE_URL}/api/v1/posts/following`;

    if (pageParam) {
      const encodedCursor = encodeURIComponent(pageParam);
      url += `?cursor=${encodedCursor}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
    });

    return handleResponse(res);
  }

  /**
   * Infinite query
   */
  const query = useInfiniteQuery<
    FeedResponse,
    Error,
    InfiniteData<FeedResponse>,
    string[],
    string | null
  >({
    queryKey: ["following-feed"],
    queryFn: ({ pageParam }) => fetchFollowing({ pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    staleTime: 1000 * 60, // 1 minute
  });

  return query;
};
