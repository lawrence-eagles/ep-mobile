import { usePostDetail } from "@/hooks/usePostDetail";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Bookmark, Heart, MessageCircle } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ================= API =================
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// ================= SHARE APPS ==============
async function shareApp(channel: string) {
  const res = await fetch(`${API_URL}/app`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel }),
  });

  if (!res.ok) throw new Error("Share failed");
  // return res.json();
  const data = await res.json();
  return data;
}

// ================= HELPERS =================
function getSafeSlug(param: unknown): string | undefined {
  if (typeof param === "string") return param;
  if (Array.isArray(param) && typeof param[0] === "string") return param[0];
  return undefined;
}

async function safeOpenURL(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) throw new Error();
    await Linking.openURL(url);
  } catch {
    Alert.alert("Error", "Unable to open link");
  }
}

// ================= SOCIAL SHARE =================
function buildShareUrl(channel: string, url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  switch (channel) {
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    default:
      return null;
  }
}

// ================= SCREEN =================
export default function PostDetailScreen() {
  const params = useLocalSearchParams();

  // ✅ FIXED TYPE ERROR (no unknown)
  const slug = getSafeSlug(params.slug);

  const {
    data,
    isLoading,
    isError,
    refetch,
    toggleLike,
    toggleBookmark,
    toggleFollow,
    isLikePending,
    isBookmarkPending,
    isFollowPending,
  } = usePostDetail(slug ?? "");

  // ================= SHARE =================
  const handleShare = async (channel: string) => {
    if (!data?.sourceUrl) {
      Alert.alert("Error", "No URL available to share");
      return;
    }

    const shareUrl = buildShareUrl(channel, data.sourceUrl, data.title ?? "");

    if (!shareUrl) return;

    await safeOpenURL(shareUrl);
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
        <Text>Error loading post</Text>
        <Pressable onPress={() => refetch()}>
          <Text style={{ color: "#007AFF", marginTop: 8 }}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ================= UI =================
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <ArrowLeft size={24} />
          </Pressable>

          <Pressable
            style={styles.recommendBtn}
            onPress={async () => {
              const data = await shareApp("post-detail");

              router.push({
                pathname: "/share/app-screen",
                params: {
                  shareId: data.shareId,
                  url: data.url,
                },
              });
            }}
          >
            <Text style={styles.recommendText}>Recommend app</Text>
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
              <Pressable onPress={toggleLike} disabled={isLikePending}>
                <Heart size={22} color={data.isLiked ? "red" : "black"} />
              </Pressable>
              <Text>{data.likesCount ?? 0}</Text>
              {/* COMMENT (FIXED) */}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/comments/comment-feed",
                    params: { postId: data.id },
                  })
                }
              >
                <MessageCircle size={22} />
              </Pressable>
              <Text>{data.commentsCount ?? 0}</Text> // note i added
              {/* BOOKMARK */}
              <Pressable onPress={toggleBookmark} disabled={isBookmarkPending}>
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
          >
            <Text style={styles.readMore}>Read full post</Text>
          </Pressable>

          {/* SHARE */}
          <Text style={styles.shareTitle}>Share this post</Text>

          <View style={styles.shareRow}>
            {["whatsapp", "twitter", "facebook", "linkedin"].map((channel) => (
              <Pressable
                key={channel}
                onPress={() => handleShare(channel)}
                style={styles.shareBtn}
              >
                <Text style={styles.shareText}>
                  {channel.charAt(0).toUpperCase() + channel.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ================= STYLES =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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

  shareText: {
    fontSize: 13,
  },
});
