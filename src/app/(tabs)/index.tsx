import EmptyHomeFeedState from "@/components/EmptyHomeFeedState";
import ErrorScreen from "@/components/Error";
import { useAuth } from "@/hooks/useAuth";
import { useForYouFeedInfiniteScroll } from "@/hooks/useForYouFeedInfiniteScroll";
import { useForYouFeedMutations } from "@/hooks/useForYouFeedMutations";
import { Post } from "@/types";
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
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ==============================
// COMPONENT
// ==============================
const ForYouFeed = () => {
  const insets = useSafeAreaInsets();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    isError,
    error,
    refetch,
  } = useForYouFeedInfiniteScroll();

  const { bookmarkMutation, unbookmarkMutation, likeMutation, unlikeMutation } =
    useForYouFeedMutations();

  const { user } = useAuth();

  const posts: Post[] = data?.pages.flatMap((p) => p.items) ?? [];

  const isInitialError = isError && posts.length === 0;

  // ==============================
  // RENDER ITEM
  // ==============================
  const renderItem = useCallback(
    ({ item }: { item: Post }) => {
      const isLiking = likeMutation.isPending || unlikeMutation.isPending;

      const isBookmarking =
        bookmarkMutation.isPending || unbookmarkMutation.isPending;

      return (
        <View style={styles.cardContainer}>
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
              style={styles.image}
              contentFit="cover"
            />
          </Pressable>

          <BlurView intensity={40} tint="light" style={styles.blurWrapper}>
            <View style={styles.card}>
              <Text style={styles.category}>
                {item.category?.toUpperCase()}
              </Text>

              <Text style={styles.title}>{item.title}</Text>

              <Text style={styles.meta}>
                {item.sourceName} •{" "}
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                })}
              </Text>

              <Text style={styles.summary}>{item.summary}</Text>

              <View style={styles.actionsRow}>
                {/* LIKE */}
                <Pressable
                  disabled={isLiking}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item.isLiked ? "Unlike post" : "Like post"
                  }
                  accessibilityState={{
                    disabled: isLiking,
                    selected: item.isLiked,
                  }}
                  hitSlop={10}
                  onPress={() => {
                    if (isLiking) return;

                    item.isLiked
                      ? unlikeMutation.mutate(item.id)
                      : likeMutation.mutate(item.id);
                  }}
                >
                  <View style={styles.actionItem}>
                    <Heart size={18} color={item.isLiked ? "red" : "black"} />
                    <Text style={styles.count}>{item.likesCount}</Text>
                  </View>
                </Pressable>

                {/* COMMENTS */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View comments"
                  hitSlop={10}
                  onPress={() =>
                    router.push({
                      pathname: "/post/[slug]",
                      params: { slug: item.slug },
                    })
                  }
                >
                  <View style={styles.actionItem}>
                    <MessageCircle size={18} />
                    <Text style={styles.count}>{item.commentsCount}</Text>
                  </View>
                </Pressable>

                {/* BOOKMARK */}
                <Pressable
                  disabled={isBookmarking}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item.isBookmarked ? "Remove bookmark" : "Bookmark post"
                  }
                  accessibilityState={{
                    disabled: isBookmarking,
                    selected: item.isBookmarked,
                  }}
                  hitSlop={10}
                  onPress={() => {
                    if (isBookmarking) return;

                    item.isBookmarked
                      ? unbookmarkMutation.mutate(item.id)
                      : bookmarkMutation.mutate(item.id);
                  }}
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

  // ==============================
  // LOADING STATE
  // ==============================
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  // ==============================
  // ERROR STATE (ONLY IF NO DATA)
  // ==============================
  if (isInitialError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ErrorScreen
          message={error?.message ?? "Failed to load feed"}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  // ==============================
  // MAIN UI
  // ==============================
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>For You</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            hitSlop={10}
            onPress={() => router.push("/preferences/profile")}
          >
            <Image
              source={{
                uri: user?.image ?? "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
            />
          </Pressable>
        </View>

        {/* LIST */}
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyHomeFeedState isLoading={false} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => {
            if (isFetchingNextPage) {
              return <ActivityIndicator style={{ marginVertical: 16 }} />;
            }

            if (isFetchNextPageError) {
              return (
                <View style={styles.footerError}>
                  <Text style={styles.footerErrorText}>
                    Failed to load more posts
                  </Text>
                  <Pressable
                    onPress={() => fetchNextPage()}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                </View>
              );
            }

            return null;
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: posts.length === 0 ? "center" : "flex-start",
            paddingBottom: insets.bottom + 80,
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default ForYouFeed;

// ==============================
// STYLES
// ==============================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  image: {
    height: 200,
    borderRadius: 20,
  },

  blurWrapper: {
    marginTop: -24,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 20,
    padding: 16,
  },

  category: {
    color: "#3B82F6",
    fontSize: 12,
    fontWeight: "600",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },

  meta: {
    color: "#6B7280",
    marginTop: 6,
    fontSize: 13,
  },

  summary: {
    color: "#4B5563",
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    alignItems: "center",
  },

  actionItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  count: {
    marginLeft: 6,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  footerError: {
    alignItems: "center",
    marginVertical: 16,
  },

  footerErrorText: {
    color: "#6B7280",
    marginBottom: 8,
  },

  retryButton: {
    backgroundColor: "#111",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
});
