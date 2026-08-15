import ErrorScreen from "@/components/Error";
import { usePostDetail } from "@/hooks/usePostDetail";
import { buildShareUrl } from "@/lib/buildShareUrl";
import { getSafeSlug, safeOpenURL } from "@/lib/helpers";
import { recordPostShare } from "@/lib/recordPostShare";
import { shareApp } from "@/lib/shareApp";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Bookmark, Heart, MessageCircle } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ================= TYPES =================

type SocialChannel = "whatsapp" | "twitter" | "facebook" | "linkedin";

// ================= SCREEN =================

export default function PostDetailScreen() {
  const [isSharing, setIsSharing] = useState(false);
  const [isCreatingAppShare, setIsCreatingAppShare] = useState(false);

  const params = useLocalSearchParams();

  const slug = getSafeSlug(params.slug);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    toggleLike,
    toggleBookmark,
    toggleFollow,
    isLikePending,
    isBookmarkPending,
    isFollowPending,
  } = usePostDetail(slug ?? "");

  // ================= RECOMMEND APP =================

  const handleRecommendApp = async () => {
    // Prevent duplicate requests while the share link is being created.
    if (isCreatingAppShare) {
      return;
    }

    setIsCreatingAppShare(true);

    try {
      const share = await shareApp("post-detail");

      // Validate the backend response before navigating.
      if (
        !share ||
        typeof share.shareId !== "string" ||
        !share.shareId.trim() ||
        typeof share.url !== "string" ||
        !share.url.trim()
      ) {
        throw new Error("Invalid share response");
      }

      router.push({
        pathname: "/share/app-screen",
        params: {
          shareId: share.shareId,
          url: share.url,
        },
      });
    } catch (error) {
      console.error("[PostDetail] Recommend app error:", error);

      Alert.alert("Error", "Unable to create a share link. Please try again.");
    } finally {
      setIsCreatingAppShare(false);
    }
  };

  // ================= SOCIAL SHARE =================

  const handleShare = async (channel: SocialChannel) => {
    // Prevent multiple share requests from being started at once.
    if (isSharing) {
      return;
    }

    if (!data?.id) {
      Alert.alert("Error", "Unable to identify this post");
      return;
    }

    if (!data.sourceUrl) {
      Alert.alert("Error", "No URL available to share");
      return;
    }

    const shareUrl = buildShareUrl(channel, data.sourceUrl, data.title ?? "");

    if (!shareUrl) {
      Alert.alert("Error", "Unsupported sharing channel");
      return;
    }

    setIsSharing(true);

    try {
      /*
       * safeOpenURL() only completes successfully when the external
       * share URL can be opened. If opening fails, recordPostShare()
       * is not called.
       */
      await safeOpenURL(shareUrl);

      /*
       * The external share flow was successfully opened.
       *
       * We cannot know whether the user actually pressed "Send"
       * inside the social-media application. Therefore this records
       * the successful handoff to the social sharing flow.
       */
      await recordPostShare(data.id);
    } catch (error) {
      console.error("[PostDetail] Social share error:", error);

      Alert.alert(
        "Unable to Share",
        "We couldn't open the selected sharing application. Please try again.",
      );
    } finally {
      setIsSharing(false);
    }
  };

  // ================= STATES =================

  if (!slug) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Invalid post</Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.center}>
        <ErrorScreen
          message={error?.message ?? "Error loading post"}
          onRetry={refetch}
          retryAccessibilityLabel={"Retry loading post"}
        />
      </SafeAreaView>
    );
  }

  // ================= UI =================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} />
          </Pressable>

          <Pressable
            style={[
              styles.recommendBtn,
              isCreatingAppShare && styles.recommendBtnDisabled,
            ]}
            onPress={handleRecommendApp}
            disabled={isCreatingAppShare}
            accessibilityRole="button"
            accessibilityLabel="Recommend app"
            accessibilityState={{
              disabled: isCreatingAppShare,
              busy: isCreatingAppShare,
            }}
          >
            {isCreatingAppShare ? (
              <View style={styles.recommendContent}>
                <ActivityIndicator size="small" color="#007AFF" />

                <Text style={styles.recommendText}>Creating App share...</Text>
              </View>
            ) : (
              <Text style={styles.recommendText}>Recommend app</Text>
            )}
          </Pressable>
        </View>

        {/* IMAGE */}

        <View style={styles.imageWrapper}>
          <Image
            source={
              data.imageUrl
                ? { uri: data.imageUrl }
                : require("@/assets/images/placeholder.png")
            }
            style={styles.image}
            contentFit="cover"
          />

          <BlurView intensity={20} style={styles.blurOverlay} />
        </View>

        {/* CONTENT */}

        <View style={styles.content}>
          {/* CATEGORY + FOLLOW */}

          <View style={styles.categoryRow}>
            <Text style={styles.category}>{data.category ?? "General"}</Text>

            <Pressable
              style={styles.followBtn}
              onPress={toggleFollow}
              disabled={isFollowPending}
              accessibilityRole="button"
              accessibilityLabel={
                data.isFollowingCategory
                  ? "Unfollow category"
                  : "Follow category"
              }
              accessibilityState={{
                disabled: isFollowPending,
                busy: isFollowPending,
              }}
            >
              <Text style={styles.followText}>
                {data.isFollowingCategory ? "Following" : "Follow"}
              </Text>
            </Pressable>
          </View>

          {/* TITLE */}

          <Text style={styles.title}>{data.title}</Text>

          {/* META */}

          <View style={styles.metaRow}>
            <Text style={styles.meta}>{data.sourceName ?? "Unknown"}</Text>

            <View style={styles.actions}>
              {/* LIKE */}

              <Pressable
                onPress={toggleLike}
                disabled={isLikePending}
                accessibilityRole="button"
                accessibilityLabel={data.isLiked ? "Unlike post" : "Like post"}
                accessibilityState={{
                  disabled: isLikePending,
                  selected: data.isLiked,
                  busy: isLikePending,
                }}
              >
                <Heart size={22} color={data.isLiked ? "red" : "black"} />
              </Pressable>

              <Text>{data.likesCount ?? 0}</Text>

              {/* COMMENT */}

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/comments/comment-feed",
                    params: {
                      postId: data.id,
                    },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="View comments"
              >
                <MessageCircle size={22} />
              </Pressable>

              <Text>{data.commentsCount ?? 0}</Text>

              {/* BOOKMARK */}

              <Pressable
                onPress={toggleBookmark}
                disabled={isBookmarkPending}
                accessibilityRole="button"
                accessibilityLabel={
                  data.isBookmarked ? "Remove bookmark" : "Bookmark post"
                }
                accessibilityState={{
                  disabled: isBookmarkPending,
                  selected: data.isBookmarked,
                  busy: isBookmarkPending,
                }}
              >
                <Bookmark
                  size={22}
                  color={data.isBookmarked ? "black" : "gray"}
                />
              </Pressable>
            </View>
          </View>

          {/* SUMMARY */}

          <Text style={styles.summary}>{data.summary}</Text>

          {/* READ FULL */}

          <Pressable
            onPress={() => data.sourceUrl && safeOpenURL(data.sourceUrl)}
            disabled={!data.sourceUrl}
            accessibilityRole="link"
            accessibilityLabel="Read full post"
            accessibilityState={{
              disabled: !data.sourceUrl,
            }}
          >
            <Text style={styles.readMore}>Read full post</Text>
          </Pressable>

          {/* SHARE */}

          <Text style={styles.shareTitle}>Share this post</Text>

          <View style={styles.shareRow}>
            {(
              ["whatsapp", "twitter", "facebook", "linkedin"] as SocialChannel[]
            ).map((channel) => (
              <Pressable
                key={channel}
                onPress={() => {
                  void handleShare(channel);
                }}
                disabled={isSharing}
                style={[styles.shareBtn, isSharing && styles.shareBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel={`Share on ${channel}`}
                accessibilityState={{
                  disabled: isSharing,
                  busy: isSharing,
                }}
              >
                <Text style={styles.shareText}>
                  {channel.charAt(0).toUpperCase() + channel.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {isSharing ? (
            <View style={styles.shareLoading}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.shareLoadingText}>Opening share...</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ================= STYLES =================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  retryText: {
    color: "#007AFF",
    marginTop: 8,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },

  recommendBtn: {
    borderWidth: 1,
    borderColor: "#007AFF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  recommendBtnDisabled: {
    opacity: 0.6,
  },

  recommendContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  recommendText: {
    color: "#007AFF",
    fontWeight: "500",
  },

  imageWrapper: {
    height: 230,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  blurOverlay: {
    ...StyleSheet.absoluteFill,
  },

  content: {
    padding: 16,
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  category: {
    color: "#007AFF",
    fontWeight: "600",
  },

  followBtn: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  followText: {
    color: "#007AFF",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  meta: {
    color: "#666",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  summary: {
    marginVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
  },

  readMore: {
    color: "#007AFF",
    fontWeight: "600",
    marginBottom: 20,
  },

  shareTitle: {
    fontWeight: "600",
    marginBottom: 10,
  },

  shareRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  shareBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },

  shareBtnDisabled: {
    opacity: 0.5,
  },

  shareText: {
    fontSize: 13,
  },

  shareLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },

  shareLoadingText: {
    color: "#666",
    fontSize: 13,
  },
});
