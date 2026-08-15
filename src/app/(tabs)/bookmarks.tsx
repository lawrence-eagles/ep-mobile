import EmptyBookmarksFeedState from "@/components/EmptyBookmarksFeedState";
import ErrorScreen from "@/components/Error";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarksFeedInfiniteScroll } from "@/hooks/useBookmarksFeedInfiniteScroll";
import { useBookmarksMutations } from "@/hooks/useBookmarksMutations";
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

/* =========================
   COMPONENT
========================= */

const Bookmarks = () => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isRefetching,
    isFetchNextPageError,
  } = useBookmarksFeedInfiniteScroll();

  const { bookmarkMutation, likeMutation, unbookmarkMutation, unlikeMutation } =
    useBookmarksMutations();

  const { user } = useAuth();

  /* =========================
     DATA
  ========================= */

  const posts = useMemo<Post[]>(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p?.items ?? []);
  }, [data]);

  /* =========================
     HELPERS
  ========================= */

  const openPost = useCallback((slug?: string | null) => {
    if (typeof slug !== "string" || !slug.trim()) return;

    router.push({
      pathname: "/post/[slug]",
      params: { slug },
    });
  }, []);

  const openProfile = useCallback(() => {
    router.push("/preferences/profile");
  }, []);

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  /* =========================
     MUTATION GUARDS
  ========================= */

  const isLikePending = likeMutation.isPending || unlikeMutation.isPending;

  const isBookmarkPending =
    bookmarkMutation.isPending || unbookmarkMutation.isPending;

  /* =========================
     HANDLERS
  ========================= */

  const handleLike = useCallback(
    (post: Post) => {
      if (isLikePending) return;

      if (post.isLiked) {
        unlikeMutation.mutate(post.id);
      } else {
        likeMutation.mutate(post.id);
      }
    },
    [isLikePending, likeMutation, unlikeMutation],
  );

  const handleBookmark = useCallback(
    (post: Post) => {
      if (isBookmarkPending) return;

      if (post.isBookmarked) {
        unbookmarkMutation.mutate(post.id);
      } else {
        bookmarkMutation.mutate(post.id);
      }
    },
    [isBookmarkPending, bookmarkMutation, unbookmarkMutation],
  );

  /* =========================
     STATES
  ========================= */

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (isError && posts.length === 0) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ErrorScreen
          message={
            error instanceof Error ? error.message : "Failed to load bookmarks"
          }
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  /* =========================
     RENDER ITEM
  ========================= */

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <Pressable
        onPress={() => openPost(item.slug)}
        style={styles.cardWrapper}
        accessibilityRole="button"
        accessibilityLabel={`Open post: ${item.title}`}
      >
        <BlurView intensity={40} tint="light" style={styles.card}>
          <Image
            source={item.imageUrl ? { uri: item.imageUrl } : undefined}
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
                onPress={() => handleLike(item)}
                style={styles.actionBtn}
                hitSlop={10}
                disabled={isLikePending}
                accessibilityRole="button"
                accessibilityLabel={item.isLiked ? "Unlike post" : "Like post"}
                accessibilityState={{
                  selected: item.isLiked,
                  disabled: isLikePending,
                }}
              >
                <Heart
                  size={18}
                  color={item.isLiked ? "#ef4444" : "#6b7280"}
                  fill={item.isLiked ? "#ef4444" : "none"}
                />
                <Text style={styles.count}>{item.likesCount}</Text>
              </Pressable>

              {/* COMMENTS */}
              <Pressable
                onPress={() => openPost(item.slug)}
                style={styles.actionBtn}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="View comments"
              >
                <MessageCircle size={18} color="#6b7280" />
                <Text style={styles.count}>{item.commentsCount}</Text>
              </Pressable>

              {/* BOOKMARK */}
              <Pressable
                onPress={() => handleBookmark(item)}
                style={styles.actionBtn}
                hitSlop={10}
                disabled={isBookmarkPending}
                accessibilityRole="button"
                accessibilityLabel={
                  item.isBookmarked ? "Remove bookmark" : "Bookmark post"
                }
                accessibilityState={{
                  selected: item.isBookmarked,
                  disabled: isBookmarkPending,
                }}
              >
                <Bookmark
                  size={18}
                  color={item.isBookmarked ? "#2563eb" : "#6b7280"}
                  fill={item.isBookmarked ? "#2563eb" : "none"}
                />
              </Pressable>
            </View>
          </View>
        </BlurView>
      </Pressable>
    ),
    [handleLike, handleBookmark, openPost, isLikePending, isBookmarkPending],
  );

  /* =========================
     UI
  ========================= */

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>

        <Pressable onPress={openProfile}>
          <Image
            source={{
              uri:
                typeof user?.image === "string"
                  ? user.image
                  : "https://ik.imagekit.io/xc7g6aws4f/user-profile-placeholder-image.jpg?updatedAt=1786553603639",
            }}
            style={styles.avatar}
          />
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={
          posts.length === 0 ? styles.emptyContainer : styles.list
        }
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
            <ActivityIndicator style={{ marginTop: 16 }} />
          ) : isFetchNextPageError ? (
            <Pressable onPress={() => fetchNextPage()} style={{ padding: 16 }}>
              <Text style={{ textAlign: "center" }}>
                Failed to load more. Tap to retry.
              </Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={<EmptyBookmarksFeedState isLoading={false} />}
      />
    </SafeAreaView>
  );
};

export default Bookmarks;

/* =========================
   STYLES (UNCHANGED)
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

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

  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  cardWrapper: {
    marginBottom: 16,
  },

  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.7)",
    flexDirection: "row",
  },

  image: {
    width: 110,
    height: 110,
  },

  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },

  title: {
    fontSize: 15,
    fontWeight: "600",
  },

  meta: {
    fontSize: 12,
    color: "#666",
    marginVertical: 4,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  count: {
    fontSize: 12,
    color: "#444",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
