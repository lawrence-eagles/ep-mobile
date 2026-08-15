import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { FeedResponse } from "@/types";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

// ==============================
// HOOK
// ==============================
export const useForYouFeedInfiniteScroll = () => {
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  return useInfiniteQuery<
    FeedResponse,
    Error,
    InfiniteData<FeedResponse>,
    ["forYouFeed"],
    string | undefined
  >({
    queryKey: ["forYouFeed"],

    // ✅ FIX 1: correct QueryFunction typing
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam;

      const url = cursor
        ? `${API_BASE_URL}/api/v1/posts?cursor=${encodeURIComponent(cursor)}`
        : `${API_BASE_URL}/api/v1/posts`;

      const cookies = authClient.getCookie();

      const res = await fetch(url, {
        headers: {
          ...(cookies ? { Cookie: cookies } : {}),
        },
        credentials: "omit",
      });

      if (!res.ok) throw new Error("Failed to fetch feed");

      return res.json();
    },

    initialPageParam: undefined,

    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};
