import EmptyExploreFeedState from "@/components/EmptyExploreFeedState";
import ErrorScreen from "@/components/Error";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useExploreFeedInfiniteScroll } from "@/hooks/useExploreFeedInfiniteScroll";
import { useExploreMutations } from "@/hooks/useExploreMutations";
import { Post } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Bookmark, Heart, MessageCircle } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
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
const Explore = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // ✅ include loading state
  const { categories = [], isLoading: isCategoriesLoading } = useCategories();

  const { useToggleMutation } = useExploreMutations();

  // ==============================
  // DEFAULT CATEGORY
  // ==============================
  const defaultCategory = useMemo(
    () => categories.find((c) => c.name === "General") ?? categories[0],
    [categories],
  );

  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(
    undefined,
  );

  // ✅ set only after categories load
  useEffect(() => {
    if (!activeCategoryId && defaultCategory?.id) {
      setActiveCategoryId(defaultCategory.id);
    }
  }, [defaultCategory, activeCategoryId]);

  // ==============================
  // FEED
  // ==============================
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isFetchNextPageError,
  } = useExploreFeedInfiniteScroll(activeCategoryId);

  const posts: Post[] = data?.pages.flatMap((p) => p.items) ?? [];

  // ==============================
  // MUTATIONS
  // ==============================
  const likeMutation = useToggleMutation("like", activeCategoryId);
  const bookmarkMutation = useToggleMutation("bookmark", activeCategoryId);

  // ==============================
  // RENDER ITEM
  // ==============================
  const renderItem = useCallback(
    ({ item }: { item: Post }) => {
      const likePending =
        likeMutation.isPending && likeMutation.variables?.postId === item.id;

      const bookmarkPending =
        bookmarkMutation.isPending &&
        bookmarkMutation.variables?.postId === item.id;

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
              <Text style={styles.category}>{item.category}</Text>

              <Text style={styles.title}>{item.title}</Text>

              <Text style={styles.meta}>
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                })}
              </Text>

              <Text style={styles.summary}>{item.summary}</Text>

              <View style={styles.actionsRow}>
                {/* LIKE */}
                <Pressable
                  disabled={likePending}
                  onPress={() =>
                    likeMutation.mutate({
                      postId: item.id,
                      isActive: item.isLiked,
                    })
                  }
                >
                  <View style={styles.actionItem}>
                    <Heart size={18} color={item.isLiked ? "red" : "black"} />
                    <Text style={styles.count}>{item.likesCount}</Text>
                  </View>
                </Pressable>

                {/* COMMENTS */}
                <Pressable
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
                  disabled={bookmarkPending}
                  onPress={() =>
                    bookmarkMutation.mutate({
                      postId: item.id,
                      isActive: item.isBookmarked,
                    })
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
    [likeMutation, bookmarkMutation],
  );

  // ==============================
  // BODY CONTENT (KEY FIX)
  // ==============================
  const renderContent = () => {
    // ✅ categories still loading
    if (isCategoriesLoading || !activeCategoryId) {
      return (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      );
    }

    // ✅ initial load for this category
    if (isLoading && posts.length === 0) {
      return (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      );
    }

    // ✅ error (but keep UI intact)
    if (isError && posts.length === 0) {
      return (
        <ErrorScreen
          message={error?.message ?? "Failed to load"}
          onRetry={refetch}
        />
      );
    }

    // ✅ main list
    return (
      <FlatList
        data={posts}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyExploreFeedState isLoading={false} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => {
          if (isFetchingNextPage) return <ActivityIndicator />;

          if (isFetchNextPageError)
            return (
              <Pressable onPress={() => fetchNextPage()}>
                <Text style={styles.retry}>Retry loading more</Text>
              </Pressable>
            );

          return null;
        }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          flexGrow: 1,
        }}
      />
    );
  };

  // ==============================
  // UI (ALWAYS RENDERED)
  // ==============================
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>

          <Pressable onPress={() => router.push("/preferences/profile")}>
            <Image
              source={{
                uri: user?.image ?? "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
            />
          </Pressable>
        </View>

        {/* TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabs}
        >
          {isCategoriesLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <View key={i} style={styles.tab} />
              ))
            : categories.map((cat) => {
                const active = cat.id === activeCategoryId;

                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setActiveCategoryId(cat.id)}
                    style={[styles.tab, active && styles.tabActive]}
                  >
                    <Text
                      style={[styles.tabText, active && styles.tabTextActive]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
        </ScrollView>

        {/* CONTENT */}
        <View style={{ flex: 1 }}>{renderContent()}</View>
      </View>
    </SafeAreaView>
  );
};

export default Explore;

// ==============================
// STYLES (UNCHANGED)
// ==============================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F7F7" },
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
  },

  headerTitle: { fontSize: 32, fontWeight: "700" },

  avatar: { width: 40, height: 40, borderRadius: 20 },

  tabs: { paddingHorizontal: 12, marginBottom: 12 },

  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginRight: 8,
  },

  tabActive: { backgroundColor: "#2563EB" },

  tabText: { color: "#374151" },

  tabTextActive: { color: "#FFF", fontWeight: "600" },

  cardContainer: { paddingHorizontal: 16, marginBottom: 24 },

  image: { height: 200, borderRadius: 20 },

  blurWrapper: { marginTop: -24 },

  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.75)",
  },

  category: { color: "#3B82F6", fontSize: 12, fontWeight: "600" },

  title: { fontSize: 18, fontWeight: "700", marginTop: 4 },

  meta: { color: "#6B7280", marginTop: 6, fontSize: 13 },

  summary: { marginTop: 8, color: "#4B5563" },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  actionItem: { flexDirection: "row", alignItems: "center" },

  count: { marginLeft: 6 },

  retry: { textAlign: "center", padding: 16, color: "#2563EB" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
