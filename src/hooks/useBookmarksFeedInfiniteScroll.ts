import { getEnv } from "@/lib/env";
import { FeedResponse } from "@/types";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

export const useBookmarksFeedInfiniteScroll = () => {
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  const handleResponse = async (res: Response): Promise<FeedResponse> => {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
  };

  async function fetchBookmarks({
    pageParam,
  }: {
    pageParam: string | null;
  }): Promise<FeedResponse> {
    let url = `${API_BASE_URL}/feed/bookmarks`;

    if (pageParam) {
      url += `?cursor=${encodeURIComponent(pageParam)}`;
    }

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    return handleResponse(res);
  }

  const query = useInfiniteQuery<
    FeedResponse,
    Error,
    InfiniteData<FeedResponse>,
    string[],
    string | null
  >({
    queryKey: ["bookmarks"],
    queryFn: ({ pageParam }) => fetchBookmarks({ pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
  });

  return query;
};
