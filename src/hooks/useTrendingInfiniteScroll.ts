import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { FeedResponse } from "@/types";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

export const useTrendingInfiniteScroll = () => {
  const cookies = authClient.getCookie();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  async function fetchTrending(cursor?: string | null): Promise<FeedResponse> {
    const url = `${API_BASE_URL}/api/v1/posts/trending${cursor ? `?cursor=${cursor}` : ""}`;

    const res = await fetch(url, {
      headers: {
        ...(cookies ? { Cookie: cookies } : {}),
      },
      credentials: "omit",
    });

    if (!res.ok) throw new Error("Failed to fetch trending");

    return res.json();
  }

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
