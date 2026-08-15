import EmptyFollowingFeedState from "@/components/EmptyFollowingFeedState";
import ErrorScreen from "@/components/Error";
import { useAuth } from "@/hooks/useAuth";
import { useFollowingInfiniteScroll } from "@/hooks/useFollowingInfiniteScroll";
import { useFollowingMutations } from "@/hooks/useFollowingMutations";
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
const Following = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    isFetchNextPageError,
  } = useFollowingInfiniteScroll();

  const { toggleBookmark, toggleLike } = useFollowingMutations();
  const { user } = useAuth();

  /**
   * =========================
   * DATA
   * =========================
   */
  const posts = useMemo(
    () => data?.pages.flatMap((p) => p.items ?? []) ?? [],
    [data],
  );

  /**
   * =========================
   * HELPERS
   * =========================
   */
  const openPost = useCallback((slug?: string | null) => {
    if (!slug) return;
    router.push({
      pathname: "/post/[slug]",
      params: { slug },
    });
  }, []);

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  /**
   * =========================
   * STATES
   * =========================
   */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (isError && posts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ErrorScreen
          message={error?.message ?? "Failed to load posts"}
          onRetry={refetch}
          retryAccessibilityLabel={"Retry loading posts"}
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
    <Pressable
      onPress={() => openPost(item.slug)}
      style={styles.cardWrapper}
      accessibilityRole="button"
      accessibilityLabel={`Open post: ${item.title}`}
    >
      <BlurView intensity={40} style={styles.card}>
        <Image
          source={item.imageUrl || undefined}
          style={styles.image}
          contentFit="cover"
        />

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.meta}>
            {item.sourceName ?? "Unknown"} • {item.category ?? "General"} •{" "}
            {formatTime(item.createdAt)}
          </Text>

          <View style={styles.actions}>
            {/* LIKE */}
            <Pressable
              onPress={() =>
                toggleLike.mutate({
                  postId: item.id,
                  isLiked: item.isLiked,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={item.isLiked ? "Unlike post" : "Like post"}
              accessibilityState={{ selected: item.isLiked }}
              hitSlop={10}
              style={styles.action}
            >
              <Heart size={18} color={item.isLiked ? "#ef4444" : "#555"} />
              <Text style={styles.count}>{item.likesCount}</Text>
            </Pressable>

            {/* COMMENTS */}
            <Pressable
              onPress={() => openPost(item.slug)}
              accessibilityRole="button"
              accessibilityLabel="View comments"
              hitSlop={10}
              style={styles.action}
            >
              <MessageCircle size={18} color="#555" />
              <Text style={styles.count}>{item.commentsCount}</Text>
            </Pressable>

            {/* BOOKMARK */}
            <Pressable
              onPress={() =>
                toggleBookmark.mutate({
                  postId: item.id,
                  isBookmarked: item.isBookmarked,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={
                item.isBookmarked ? "Remove bookmark" : "Bookmark post"
              }
              accessibilityState={{ selected: item.isBookmarked }}
              hitSlop={10}
              style={styles.action}
            >
              <Bookmark
                size={18}
                color={item.isBookmarked ? "#2563eb" : "#555"}
              />
            </Pressable>
          </View>
        </View>
      </BlurView>
    </Pressable>
  );

  /**
   * =========================
   * MAIN
   * =========================
   */
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER (NEW) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Following</Text>

        {/* Replace with real user avatar */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => router.push("/preferences/profile")}
        >
          <Image
            source={{
              uri:
                user?.image ??
                "https://ik.imagekit.io/xc7g6aws4f/user-profile-placeholder-image.jpg?updatedAt=1786553603639",
            }}
            style={styles.avatar}
          />
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListEmptyComponent={<EmptyFollowingFeedState isLoading={false} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : isFetchNextPageError ? (
            <Pressable onPress={() => fetchNextPage()} style={{ padding: 16 }}>
              <Text style={{ textAlign: "center" }}>
                Failed to load more. Tap to retry.
              </Text>
            </Pressable>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

export default Following;

/**
 * =========================
 * STYLES (PRESERVED + HEADER)
 * =========================
 */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
  },

  cardWrapper: { marginBottom: 16 },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.7)",
    flexDirection: "row",
  },
  image: { width: 110, height: 110 },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  title: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, color: "#666", marginVertical: 4 },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  count: { fontSize: 12, color: "#444" },
});
