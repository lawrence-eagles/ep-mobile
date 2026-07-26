import EmptyTrendingFeedState from "@/components/EmptyTrendingFeedState";
import ErrorScreen from "@/components/Error";
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

export default function Trending() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError, // ✅ NEW
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

  // ✅ ONLY show full error if no posts exist
  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (isError && posts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ErrorScreen
          message={error?.message ?? "Failed to load posts"}
          onRetry={refetch}
        />
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
          {/* LIKE */}
          <Pressable
            onPress={() => handleLike(item)}
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel={item.isLiked ? "Unlike post" : "Like post"}
            accessibilityState={{ selected: item.isLiked }}
            hitSlop={10}
          >
            <Heart
              size={20}
              color={item.isLiked ? "red" : "black"}
              fill={item.isLiked ? "red" : "none"}
            />
            <Text>{item.likesCount}</Text>
          </Pressable>

          {/* COMMENTS */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/post/[slug]",
                params: { slug: item.slug },
              })
            }
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel="View comments"
            hitSlop={10}
          >
            <MessageCircle size={20} />
            <Text>{item.commentsCount}</Text>
          </Pressable>

          {/* BOOKMARK */}
          <Pressable
            onPress={() => handleBookmark(item)}
            accessibilityRole="button"
            accessibilityLabel={
              item.isBookmarked ? "Remove bookmark" : "Bookmark post"
            }
            accessibilityState={{ selected: item.isBookmarked }}
            hitSlop={10}
          >
            <Bookmark size={20} fill={item.isBookmarked ? "black" : "none"} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  /**
   * =========================
   * FOOTER (Pagination Error Fix)
   * =========================
   */
  const ListFooter = () => {
    if (isFetchingNextPage) {
      return <ActivityIndicator style={{ marginVertical: 20 }} />;
    }

    if (isFetchNextPageError) {
      return (
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <Text style={styles.errorText}>Failed to load more posts</Text>
          <Pressable
            onPress={() => fetchNextPage()}
            style={styles.retryBtn}
            accessibilityRole="button"
            accessibilityLabel="Retry loading more posts"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return null;
  };

  /**
   * =========================
   * UI
   * =========================
   */
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trending</Text>

        <Pressable
          onPress={() => router.push("/preferences/profile")}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
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
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()} // ✅ FIXED
          />
        }
        ListFooterComponent={<ListFooter />}
      />
    </SafeAreaView>
  );
}

/**
 * =========================
 * STYLES (UNCHANGED)
 * =========================
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F7",
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
    ...StyleSheet.absoluteFill,
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
