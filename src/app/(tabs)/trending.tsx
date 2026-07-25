import EmptyTrendingFeedState from "@/components/EmptyTrendingFeedState";
import { useAuth } from "@/hooks/useAuth";
import { useTrendingInfiniteScroll } from "@/hooks/useTrendingInfiniteScroll";
import { useTrendingMutations } from "@/hooks/useTrendingMutations";
import { Post } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Bookmark, Heart, MessageCircle } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * =========================
 * COMPONENT
 * =========================
 */
export default function Trending() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTrendingInfiniteScroll();
  const { bookmarkMutation, likeMutation } = useTrendingMutations();
  const { user } = useAuth();

  const posts = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  /**
   * =========================
   * HANDLERS
   * =========================
   */
  const handleLike = useCallback(
    (post: Post) => {
      likeMutation.mutate({
        postId: post.id,
        isLiked: post.isLiked,
      });
    },
    [likeMutation],
  );

  const handleBookmark = useCallback(
    (post: Post) => {
      bookmarkMutation.mutate({
        postId: post.id,
        isBookmarked: post.isBookmarked,
      });
    },
    [bookmarkMutation],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /**
   * =========================
   * STATES
   * =========================
   */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!posts.length) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <Text>No trending posts yet</Text>
      </SafeAreaView>
    );
  }

  /**
   * =========================
   * RENDER ITEM
   * =========================
   */
  const renderItem = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      <BlurView intensity={40} style={styles.blur} />

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/post/[slug]",
            params: { slug: item.slug },
          })
        }
      >
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            contentFit="cover"
          />
        )}
      </Pressable>

      <View style={styles.content}>
        {item.category && (
          <Text style={styles.category}>{item.category.toUpperCase()}</Text>
        )}

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/post/[slug]",
              params: { slug: item.slug },
            })
          }
        >
          <Text style={styles.title}>{item.title}</Text>
        </Pressable>

        <Text style={styles.time}>
          {formatDistanceToNow(new Date(item.createdAt), {
            addSuffix: true,
          })}
        </Text>

        <Text style={styles.summary} numberOfLines={2}>
          {item.summary}
        </Text>

        <View style={styles.actions}>
          <Pressable onPress={() => handleLike(item)} style={styles.action}>
            <Heart
              size={20}
              color={item.isLiked ? "red" : "black"}
              fill={item.isLiked ? "red" : "none"}
            />
            <Text>{item.likesCount}</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/post/[slug]",
                params: { slug: item.slug },
              })
            }
            style={styles.action}
          >
            <MessageCircle size={20} />
            <Text>{item.commentsCount}</Text>
          </Pressable>

          <Pressable onPress={() => handleBookmark(item)}>
            <Bookmark size={20} fill={item.isBookmarked ? "black" : "none"} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  /**
   * =========================
   * UI
   * =========================
   */
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trending</Text>

        <Pressable onPress={() => router.push("/preferences/profile")}>
          <Image
            source={{ uri: user?.image ?? "https://i.pravatar.cc/100" }}
            style={styles.avatar}
          />
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyTrendingFeedState isLoading={false} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={{ marginVertical: 20 }} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

/**
 * =========================
 * STYLES
 * =========================
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  card: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  blur: {
    ...StyleSheet.absoluteFill, // ✅ FIXED
  },
  image: {
    width: "100%",
    height: 200,
  },
  content: {
    padding: 12,
  },
  category: {
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  time: {
    color: "#6b7280",
    marginBottom: 6,
  },
  summary: {
    color: "#374151",
    marginBottom: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    marginBottom: 10,
  },
  retryBtn: {
    padding: 10,
    backgroundColor: "black",
    borderRadius: 8,
  },
  retryText: {
    color: "white",
  },
});
