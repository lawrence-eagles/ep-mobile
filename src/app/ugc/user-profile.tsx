import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Ban,
  ChevronRight,
  TriangleAlert,
  UserRound,
} from "lucide-react-native";
import { useCallback } from "react";
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

// ================= CONFIGURATION =================

const API_BASE_URL = getEnv().BACKEND_URL.replace(/\/+$/, "");

// ================= TYPES =================

interface BlockUserResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// ================= COMPONENT =================

const ReportUserProfile = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    userId: userIdParam,
    userImage: userImageParam,
    userName: userNameParam,
  } = useLocalSearchParams<{
    userId?: string;
    userImage?: string;
    userName?: string;
  }>();

  // Normalize route parameters.
  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

  const userImage = Array.isArray(userImageParam)
    ? userImageParam[0]
    : userImageParam;

  const userName = Array.isArray(userNameParam)
    ? userNameParam[0]
    : userNameParam;

  const displayName = userName?.trim() || "User";

  // ================= BLOCK USER API =================

  const handleBlockUser = useCallback(
    async (targetUserId: string): Promise<void> => {
      if (!targetUserId?.trim()) {
        throw new Error("Invalid user ID.");
      }

      const cookies = await authClient.getCookie();

      if (!cookies) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/users/${encodeURIComponent(
          targetUserId,
        )}/block`,
        {
          method: "POST",
          headers: {
            Cookie: cookies,
            Accept: "application/json",
          },
          credentials: "omit",
        },
      );

      let responseData: BlockUserResponse | null = null;

      try {
        responseData = (await response.json()) as BlockUserResponse;
      } catch {
        responseData = null;
      }

      if (!response.ok || responseData?.success === false) {
        throw new Error(
          responseData?.message ||
            responseData?.error ||
            `Failed to block user. Server returned ${response.status}.`,
        );
      }

      // Invalidate comment and reply queries across all posts.
      // Prefix matching also covers cursor-specific reply query keys.
      const invalidationPromises = [
        queryClient.invalidateQueries({
          queryKey: ["comments"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["replies"],
        }),

        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryRoot = query.queryKey[0];

            return (
              typeof queryRoot === "string" &&
              [
                "forYouFeed",
                "explore-feed",
                "following-feed",
                "trending-feed",
                "bookmarks",
              ].includes(queryRoot)
            );
          },
        }),
      ];

      await Promise.all(invalidationPromises);
    },
    [queryClient],
  );

  // ================= BLOCK USER MUTATION =================

  const blockUserMutation = useMutation<void, Error, string>({
    mutationFn: handleBlockUser,
  });

  const handleBlockUserPress = useCallback(async () => {
    if (!userId) {
      Alert.alert(
        "Unable to block user",
        "The user ID could not be found. Please try again.",
      );
      return;
    }

    if (blockUserMutation.isPending) {
      return;
    }

    try {
      await blockUserMutation.mutateAsync(userId);

      Alert.alert(
        "User blocked",
        `${displayName} has been blocked successfully.`,
        [{ text: "OK" }],
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while blocking this user.";

      Alert.alert("Unable to block user", message, [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Retry",
          onPress: () => {
            void handleBlockUserPress();
          },
        },
      ]);
    }
  }, [
    userId,
    displayName,
    blockUserMutation.isPending,
    blockUserMutation.mutateAsync,
  ]);

  // ================= REPORT USER NAVIGATION =================

  const handleReportUserPress = useCallback(() => {
    if (!userId) {
      Alert.alert(
        "Unable to report user",
        "The user ID could not be found. Please try again.",
      );
      return;
    }

    router.push({
      pathname: "/ugc/report-user",
      params: {
        userId,
        type: "user",
      },
    });
  }, [router, userId]);

  // ================= UI =================

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* Background gradient */}
      <LinearGradient
        colors={["#087BFF", "#3695FF", "#A9D2FF", "#EDF6FF", "#FFFFFF"]}
        locations={[0, 0.28, 0.62, 0.88, 1]}
        style={styles.backgroundGradient}
      />

      {/* Decorative background shapes */}
      <View style={styles.backgroundShapeOne} />
      <View style={styles.backgroundShapeTwo} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ================= PROFILE HEADER ================= */}

          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {userImage ? (
                <Image
                  source={{ uri: userImage }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  onError={() => {
                    // The fallback is rendered when no usable image is supplied.
                  }}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <UserRound size={64} color="#8A9BB3" strokeWidth={1.5} />
                </View>
              )}
            </View>

            <Text
              style={styles.userName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {displayName}
            </Text>
          </View>

          {/* ================= PROFILE ACTIONS ================= */}

          <View style={styles.actionsContainer}>
            {/* Block User */}

            <Pressable
              onPress={() => void handleBlockUserPress()}
              disabled={!userId || blockUserMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel={`Block ${displayName}`}
              accessibilityState={{
                disabled: !userId || blockUserMutation.isPending,
                busy: blockUserMutation.isPending,
              }}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && !blockUserMutation.isPending
                  ? styles.actionCardPressed
                  : null,
                (!userId || blockUserMutation.isPending) &&
                  styles.actionCardDisabled,
              ]}
            >
              <BlurView
                intensity={55}
                tint="light"
                style={styles.actionCardBlur}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.blockIconContainer}>
                    {blockUserMutation.isPending ? (
                      <ActivityIndicator size="small" color="#0866F5" />
                    ) : (
                      <Ban size={32} color="#0866F5" strokeWidth={2.5} />
                    )}
                  </View>

                  <Text style={styles.actionText}>
                    {blockUserMutation.isPending
                      ? "Blocking User..."
                      : "Block User"}
                  </Text>

                  {!blockUserMutation.isPending && (
                    <ChevronRight size={30} color="#263F70" strokeWidth={2} />
                  )}
                </View>
              </BlurView>
            </Pressable>

            {/* Report User */}

            <Pressable
              onPress={handleReportUserPress}
              accessibilityRole="button"
              accessibilityLabel={`Report ${displayName}`}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.actionCardPressed,
              ]}
            >
              <BlurView
                intensity={55}
                tint="light"
                style={styles.actionCardBlur}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.reportIconContainer}>
                    <TriangleAlert
                      size={32}
                      color="#F4770B"
                      strokeWidth={2.5}
                    />
                  </View>

                  <Text style={styles.actionText}>Report User</Text>

                  <ChevronRight size={30} color="#263F70" strokeWidth={2} />
                </View>
              </BlurView>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ReportUserProfile;

// ================= STYLES =================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  safeArea: {
    flex: 1,
  },

  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 470,
  },

  backgroundShapeOne: {
    position: "absolute",
    top: 105,
    right: -115,
    width: 330,
    height: 250,
    borderRadius: 180,
    backgroundColor: "rgba(255,255,255,0.09)",
    transform: [{ rotate: "-25deg" }],
  },

  backgroundShapeTwo: {
    position: "absolute",
    top: 280,
    left: -145,
    width: 360,
    height: 190,
    borderRadius: 180,
    backgroundColor: "rgba(255,255,255,0.12)",
    transform: [{ rotate: "-20deg" }],
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Profile header

  profileHeader: {
    alignItems: "center",
    paddingTop: 75,
    paddingHorizontal: 24,
  },

  avatarContainer: {
    width: 154,
    height: 154,
    borderRadius: 80,
    borderWidth: 5,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: "#E6EEF8",
    shadowColor: "#174B91",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 80,
  },

  avatarFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7EEF8",
  },

  userName: {
    marginTop: 30,
    color: "#071F49",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.8,
  },

  // Action cards

  actionsContainer: {
    marginTop: 80,
    paddingHorizontal: 20,
    gap: 5,
  },

  actionCard: {
    height: 88,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.76)",
    shadowColor: "#4778B5",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.09,
    shadowRadius: 15,
    elevation: 4,
  },

  actionCardBlur: {
    flex: 1,
    justifyContent: "center",
  },

  actionCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
  },

  actionCardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },

  actionCardDisabled: {
    opacity: 0.75,
  },

  blockIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 30,
    backgroundColor: "rgba(8,102,245,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 22,
  },

  reportIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 30,
    backgroundColor: "rgba(244,119,11,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 22,
  },

  actionText: {
    flex: 1,
    color: "#071F49",
    fontSize: 19,
    fontWeight: "500",
    letterSpacing: -0.4,
  },
});
