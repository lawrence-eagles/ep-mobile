import { getEnv } from "@/lib/env";
import { FeedResponse } from "@/types";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

export const useExploreFeedInfiniteScroll = (activeCategoryId?: string) => {
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  const fetchCategoryFeed = async ({
    pageParam,
    categoryId,
  }: {
    pageParam?: string | null;
    categoryId: string;
  }): Promise<FeedResponse> => {
    const url = new URL(`${API_BASE_URL}/category-feed/${categoryId}`);

    if (pageParam) {
      url.searchParams.append("cursor", pageParam);
    }

    const res = await fetch(url.toString(), {
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch feed");
    }

    return res.json();
  };

  const query = useInfiniteQuery<
    FeedResponse,
    Error,
    InfiniteData<FeedResponse>,
    [string, string | undefined],
    string | null
  >({
    queryKey: ["explore-feed", activeCategoryId],

    // ✅ FIX IS HERE
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      fetchCategoryFeed({
        pageParam,
        categoryId: activeCategoryId!, // safe because enabled below
      }),

    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,

    initialPageParam: null,

    enabled: !!activeCategoryId,
  });

  return query;
};
