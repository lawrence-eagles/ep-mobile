import { getEnv } from "@/lib/env";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Bookmark, Heart, MessageCircle } from "lucide-react-native";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

// ==============================
// TYPES
// ==============================
type Post = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  summary: string | null;
  createdAt: string;
  category: string | null;
  sourceName: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
};

type FeedResponse = {
  items: Post[];
  nextCursor: string | null;
};

// ==============================
// HOOK
// ==============================
const useForYouFeed = () => {
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
        ? `${API_BASE_URL}/feed?cursor=${cursor}`
        : `${API_BASE_URL}/feed`;

      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) throw new Error("Failed to fetch feed");

      return res.json();
    },

    initialPageParam: undefined,

    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

// ==============================
// COMPONENT
// ==============================
const ForYouFeed = () => {
  const queryClient = useQueryClient();
  const env = getEnv();
  const API_BASE_URL = env.BACKEND_URL;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useForYouFeed();

  // ✅ FIX 2: fully type-safe flatten
  const posts: Post[] = data?.pages.flatMap((p) => p.items) ?? [];

  // ==============================
  // HELPER
  // ==============================
  const updatePost = (
    old: InfiniteData<FeedResponse> | undefined,
    updater: (post: Post) => Post,
  ): InfiniteData<FeedResponse> | undefined => {
    if (!old) return old;

    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map(updater),
      })),
    };
  };

  // ==============================
  // LIKE
  // ==============================
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) throw new Error("Like failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      const previous = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "forYouFeed",
      ]);

      queryClient.setQueryData(["forYouFeed"], (old) =>
        updatePost(old, (p) =>
          p.id === postId
            ? { ...p, isLiked: true, likesCount: p.likesCount + 1 }
            : p,
        ),
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["forYouFeed"], ctx.previous);
      }
    },
  });

  // ==============================
  // UNLIKE
  // ==============================
  const unlikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/unlike/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Unlike failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      const previous = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "forYouFeed",
      ]);

      queryClient.setQueryData(["forYouFeed"], (old) =>
        updatePost(old, (p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: false,
                likesCount: Math.max(p.likesCount - 1, 0),
              }
            : p,
        ),
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["forYouFeed"], ctx.previous);
      }
    },
  });

  // ==============================
  // BOOKMARK
  // ==============================
  const bookmarkMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) throw new Error("Bookmark failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      const previous = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "forYouFeed",
      ]);

      queryClient.setQueryData(["forYouFeed"], (old) =>
        updatePost(old, (p) =>
          p.id === postId ? { ...p, isBookmarked: true } : p,
        ),
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["forYouFeed"], ctx.previous);
      }
    },
  });

  // ==============================
  // UNBOOKMARK
  // ==============================
  const unbookmarkMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`${API_BASE_URL}/unbookmark/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Unbookmark failed");
    },

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["forYouFeed"] });

      const previous = queryClient.getQueryData<InfiniteData<FeedResponse>>([
        "forYouFeed",
      ]);

      queryClient.setQueryData(["forYouFeed"], (old) =>
        updatePost(old, (p) =>
          p.id === postId ? { ...p, isBookmarked: false } : p,
        ),
      );

      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["forYouFeed"], ctx.previous);
      }
    },
  });

  // ==============================
  // RENDER ITEM
  // ==============================
  const renderItem = useCallback(
    ({ item }: { item: Post }) => {
      return (
        <View className="px-4 mb-6">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/post/[slug]",
                params: { slug: item.slug },
              })
            }
          >
            <Image
              source={{ uri: item.imageUrl || "" }}
              style={{ height: 200, borderRadius: 20 }}
              contentFit="cover"
            />
          </Pressable>

          <BlurView intensity={40} tint="light" style={{ marginTop: -24 }}>
            <View className="bg-white/70 rounded-2xl p-4">
              <Text className="text-blue-500 text-xs font-semibold">
                {item.category?.toUpperCase()}
              </Text>

              <Text className="text-lg font-bold mt-1">{item.title}</Text>

              <Text className="text-gray-500 mt-2">
                {item.sourceName} •{" "}
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                })}
              </Text>

              <Text className="text-gray-600 mt-2">{item.summary}</Text>

              <View className="flex-row justify-between mt-4">
                <Pressable
                  onPress={() =>
                    item.isLiked
                      ? unlikeMutation.mutate(item.id)
                      : likeMutation.mutate(item.id)
                  }
                >
                  <View className="flex-row items-center gap-1">
                    <Heart size={18} color={item.isLiked ? "red" : "black"} />
                    <Text>{item.likesCount}</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/post/[slug]",
                      params: { slug: item.slug },
                    })
                  }
                >
                  <View className="flex-row items-center gap-1">
                    <MessageCircle size={18} />
                    <Text>{item.commentsCount}</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() =>
                    item.isBookmarked
                      ? unbookmarkMutation.mutate(item.id)
                      : bookmarkMutation.mutate(item.id)
                  }
                >
                  <Bookmark
                    size={18}
                    color={item.isBookmarked ? "black" : "gray"}
                  />
                </Pressable>
              </View>
            </View>
          </BlurView>
        </View>
      );
    },
    [likeMutation, unlikeMutation, bookmarkMutation, unbookmarkMutation],
  );

  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: 100 }} />;
  }

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      <View className="px-4 flex-row justify-between items-center mb-4">
        <Text className="text-3xl font-bold">For You</Text>

        <Pressable onPress={() => router.push("/preferences/profile")}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator /> : null}
      />
    </View>
  );
};

export default ForYouFeed;
