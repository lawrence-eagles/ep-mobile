import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { FeedResponse } from "@/types";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

// ==============================
// HOOK
// ==============================

export const useTrendingInfiniteScroll = () => {
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  // ==============================
  // FETCH TRENDING FEED
  // ==============================

  async function fetchTrending(cursor?: string | null): Promise<FeedResponse> {
    const baseUrl = `${API_BASE_URL}/api/v1/posts/trending`;

    // Encode the opaque cursor before placing it
    // inside the URL query string.
    const url = cursor
      ? `${baseUrl}?cursor=${encodeURIComponent(cursor)}`
      : baseUrl;

    // Get the current Better Auth session cookie
    // immediately before making the authenticated request.
    const cookies = authClient.getCookie();

    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch trending");
    }

    return res.json();
  }

  // ==============================
  // INFINITE QUERY
  // ==============================

  const query = useInfiniteQuery<
    FeedResponse,
    Error,
    InfiniteData<FeedResponse>,
    ["trending-feed"],
    string | null
  >({
    queryKey: ["trending-feed"],

    queryFn: ({ pageParam }) => fetchTrending(pageParam ?? null),

    initialPageParam: null,

    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
  });

  return query;
};
