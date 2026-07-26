import EmptyFollowingFeedState from "@/components/EmptyFollowingFeedState";
import ErrorScreen from "@/components/Error";
import { useFollowingInfiniteScroll } from "@/hooks/useFollowingInfiniteScroll";
import { useFollowingMutations } from "@/hooks/useFollowingMutations";
import { Post } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Bookmark, Heart, MessageCircle } from "lucide-react-native";
import { useMemo } from "react";
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

  /**
   * =========================
   * DATA
   * =========================
   */
  const posts = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  /**
   * =========================
   * STATES
   * =========================
   */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
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
      onPress={() =>
        router.push({
          pathname: "/post/[slug]",
          params: { slug: item.slug },
        })
      }
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
          <Text style={styles.title}>{item.title}</Text>

          <Text style={styles.meta}>
            {item.sourceName ?? "Unknown"} • {item.category ?? "General"} •{" "}
            {formatDistanceToNow(new Date(item.createdAt), {
              addSuffix: true,
            })}
          </Text>

          <View style={styles.actions}>
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

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/post/[slug]",
                  params: { slug: item.slug },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="View comments"
              hitSlop={10}
              style={styles.action}
            >
              <MessageCircle size={18} color="#555" />
              <Text style={styles.count}>{item.commentsCount}</Text>
            </Pressable>

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
              accessibilityState={{
                selected: item.isBookmarked,
              }}
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
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
              <Text style={{ textAlign: "center" }}>Retry loading more</Text>
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
 * STYLES (UNCHANGED)
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
    marginBottom: 10,
  },
  headerTitle: { fontSize: 32, fontWeight: "700" },
  avatar: { width: 36, height: 36, borderRadius: 999 },
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
