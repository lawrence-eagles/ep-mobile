import { getEnv } from "@/lib/env";
import { FeedResponse } from "@/types";
import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

export const useFollowingInfiniteScroll = () => {
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  const handleResponse = async (res: Response) => {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json();
  };

  async function fetchFollowing({
    pageParam,
  }: {
    pageParam: string | null;
  }): Promise<FeedResponse> {
    const url = new URL(`${API_BASE_URL}/feed/following`);
    if (pageParam) url.searchParams.append("cursor", pageParam);

    const res = await fetch(url.toString(), {
      credentials: "include",
    });

    return handleResponse(res);
  }

  const query = useInfiniteQuery<
    FeedResponse,
    Error,
    InfiniteData<FeedResponse>
  >({
    queryKey: ["following-feed"],
    queryFn: ({ pageParam }) =>
      fetchFollowing({ pageParam: pageParam as string | null }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60,
  });

  return query;
};
