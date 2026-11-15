import { fetchBlockedUsers, unblockUserRequest } from "@/lib/helpers";
import type { BlockedUser, UnblockUserResponse } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowLeft, RefreshCw, UserRound, Users } from "lucide-react-native";
import { useCallback } from "react";
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

const BLOCKED_USERS_QUERY_KEY = ["blocked-users"] as const;

const PAGE_BACKGROUND = "#FFFFFF";
const PRIMARY_BLUE = "#172A9B";
const ACCENT_BLUE = "#176BFF";
const DESCRIPTION_BLUE = "#5475E9";
const BORDER_COLOR = "#E6EEFF";
const MUTED_TEXT = "#8793AA";

// ============================================================
// CACHE INVALIDATION
// ============================================================

/**
 * Invalidate queries affected by blocking/unblocking a user.
 *
 * Prefix matching also invalidates queries with additional
 * parameters, such as post IDs and reply cursors.
 */
async function invalidateUserRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> {
  const invalidationPromises = [
    // Refresh the blocked users list.
    queryClient.invalidateQueries({
      queryKey: BLOCKED_USERS_QUERY_KEY,
    }),

    // Refresh comments and replies.
    queryClient.invalidateQueries({
      queryKey: ["comments"],
    }),

    queryClient.invalidateQueries({
      queryKey: ["replies"],
    }),

    // Refresh feeds and other user-specific content.
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
}

// ============================================================
// BLOCKED USER SCREEN
// ============================================================

export default function BlockedUsersScreen() {
  const queryClient = useQueryClient();

  // ==========================================================
  // FETCH BLOCKED USERS
  // ==========================================================

  const {
    data: blockedUsers = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<BlockedUser[], Error>({
    queryKey: BLOCKED_USERS_QUERY_KEY,
    queryFn: fetchBlockedUsers,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
  });

  // ==========================================================
  // UNBLOCK USER MUTATION
  // ==========================================================

  const unblockMutation = useMutation<
    UnblockUserResponse,
    Error,
    string,
    { previousUsers: BlockedUser[] | undefined }
  >({
    mutationFn: unblockUserRequest,

    // --------------------------------------------------------
    // Optimistically remove the user from the list.
    // --------------------------------------------------------

    onMutate: async (targetUserId) => {
      await queryClient.cancelQueries({
        queryKey: BLOCKED_USERS_QUERY_KEY,
      });

      const previousUsers = queryClient.getQueryData<BlockedUser[]>(
        BLOCKED_USERS_QUERY_KEY,
      );

      queryClient.setQueryData<BlockedUser[]>(
        BLOCKED_USERS_QUERY_KEY,
        (oldUsers) =>
          oldUsers?.filter((user) => user.userId !== targetUserId) ?? [],
      );

      return { previousUsers };
    },

    // --------------------------------------------------------
    // Restore the previous list if the request fails.
    // --------------------------------------------------------

    onError: (_error, _targetUserId, context) => {
      if (context?.previousUsers !== undefined) {
        queryClient.setQueryData(
          BLOCKED_USERS_QUERY_KEY,
          context.previousUsers,
        );
      }
    },

    // --------------------------------------------------------
    // Refresh all affected queries after the operation.
    // --------------------------------------------------------

    onSettled: async () => {
      await invalidateUserRelatedQueries(queryClient);
    },
  });

  // ==========================================================
  // HANDLE UNBLOCK USER
  // ==========================================================

  const handleUnblockUser = useCallback(
    async (targetUserId: string): Promise<void> => {
      if (!targetUserId?.trim()) {
        return;
      }

      if (unblockMutation.isPending) {
        return;
      }

      try {
        await unblockMutation.mutateAsync(targetUserId);
      } catch (error) {
        // The mutation's onError handles cache rollback.
        // The error is displayed in the screen below.
        console.error("Failed to unblock user:", error);
      }
    },
    [unblockMutation],
  );

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, []);

  // ==========================================================
  // ERROR MESSAGE
  // ==========================================================

  const unblockError = unblockMutation.error?.message;

  // ==========================================================
  // RENDER BLOCKED USER
  // ==========================================================

  const renderBlockedUser = useCallback(
    ({ item, index }: { item: BlockedUser; index: number }) => {
      const isUnblocking =
        unblockMutation.isPending && unblockMutation.variables === item.userId;

      const isAnyUnblocking = unblockMutation.isPending;

      return (
        <View>
          <View style={styles.userRow}>
            {/* PROFILE IMAGE */}

            <View style={styles.avatarContainer}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  onError={() => {
                    console.warn(
                      `Unable to load profile image for ${item.userId}`,
                    );
                  }}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <UserRound size={34} color={PRIMARY_BLUE} strokeWidth={1.7} />
                </View>
              )}
            </View>

            {/* USER NAME */}

            <View style={styles.userInfo}>
              <Text
                style={styles.userName}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.name}
              </Text>
            </View>

            {/* UNBLOCK BUTTON */}

            <Pressable
              style={({ pressed }) => [
                styles.unblockButton,
                pressed && styles.unblockButtonPressed,
                isAnyUnblocking && styles.unblockButtonDisabled,
              ]}
              onPress={() => handleUnblockUser(item.userId)}
              disabled={isAnyUnblocking}
              accessibilityRole="button"
              accessibilityLabel={`Unblock ${item.name}`}
              accessibilityState={{
                disabled: isAnyUnblocking,
                busy: isUnblocking,
              }}
            >
              {isUnblocking ? (
                <ActivityIndicator size="small" color={ACCENT_BLUE} />
              ) : (
                <Text style={styles.unblockButtonText}>Unblock</Text>
              )}
            </Pressable>
          </View>

          {/* SEPARATOR */}

          {index !== blockedUsers.length - 1 && (
            <View style={styles.separator} />
          )}
        </View>
      );
    },
    [
      blockedUsers.length,
      handleUnblockUser,
      unblockMutation.isPending,
      unblockMutation.variables,
    ],
  );

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Users size={38} color={ACCENT_BLUE} strokeWidth={1.6} />
      </View>

      <Text style={styles.emptyTitle}>No blocked users</Text>

      <Text style={styles.emptyDescription}>
        Users you block will appear here. You can unblock them whenever you
        want.
      </Text>
    </View>
  );

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.screenContainer}>
          <View style={styles.header}>
            <Pressable
              onPress={handleGoBack}
              style={styles.backButton}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={30} color={PRIMARY_BLUE} strokeWidth={2.2} />
            </Pressable>

            <Text style={styles.headerTitle}>Blocked Users</Text>

            <View style={styles.headerRightPlaceholder} />
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ACCENT_BLUE} />

            <Text style={styles.loadingText}>Loading blocked users...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.screenContainer}>
          <View style={styles.header}>
            <Pressable
              onPress={handleGoBack}
              style={styles.backButton}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={30} color={PRIMARY_BLUE} strokeWidth={2.2} />
            </Pressable>

            <Text style={styles.headerTitle}>Blocked Users</Text>

            <View style={styles.headerRightPlaceholder} />
          </View>

          <View style={styles.errorContainer}>
            <RefreshCw size={40} color={DESCRIPTION_BLUE} strokeWidth={1.7} />

            <Text style={styles.errorTitle}>Unable to load blocked users</Text>

            <Text style={styles.errorDescription}>
              {error?.message || "Something went wrong. Please try again."}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
              onPress={() => refetch()}
              accessibilityRole="button"
              accessibilityLabel="Retry loading blocked users"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // MAIN SCREEN
  // ==========================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.screenContainer}>
        {/* ==================================================
            HEADER
        ================================================== */}

        <View style={styles.header}>
          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={30} color={PRIMARY_BLUE} strokeWidth={2.2} />
          </Pressable>

          <Text style={styles.headerTitle}>Blocked Users</Text>

          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* ==================================================
            DESCRIPTION
        ================================================== */}

        <Text style={styles.description}>
          You will no longer see comments or replies from users you block. You
          can unblock them at any time.
        </Text>

        {/* ==================================================
            BLUR CARD
        ================================================== */}

        <View style={styles.cardWrapper}>
          <BlurView intensity={35} tint="light" style={styles.blurCard}>
            <FlatList
              data={blockedUsers}
              keyExtractor={(item) => item.userId}
              renderItem={renderBlockedUser}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                blockedUsers.length === 0 && styles.emptyListContent,
              ]}
              ItemSeparatorComponent={undefined}
              ListEmptyComponent={renderEmptyState}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor={ACCENT_BLUE}
                  colors={[ACCENT_BLUE]}
                />
              }
              keyboardShouldPersistTaps="handled"
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={true}
            />
          </BlurView>
        </View>

        {/* ==================================================
            UNBLOCK ERROR
        ================================================== */}

        {unblockError && (
          <View style={styles.mutationErrorContainer}>
            <Text style={styles.mutationErrorText}>{unblockError}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PAGE_BACKGROUND,
  },

  screenContainer: {
    flex: 1,
    paddingHorizontal: 22,
    backgroundColor: PAGE_BACKGROUND,
  },

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  header: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 46,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  backButtonPressed: {
    opacity: 0.55,
  },

  headerTitle: {
    flex: 1,
    fontSize: 25,
    fontWeight: "800",
    color: PRIMARY_BLUE,
    textAlign: "center",
    letterSpacing: -0.6,
  },

  headerRightPlaceholder: {
    width: 42,
  },

  // ----------------------------------------------------------
  // DESCRIPTION
  // ----------------------------------------------------------

  description: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "400",
    color: DESCRIPTION_BLUE,
    textAlign: "center",
    marginTop: 17,
    marginBottom: 43,
    paddingHorizontal: 4,
  },

  // ----------------------------------------------------------
  // BLUR CARD
  // ----------------------------------------------------------

  cardWrapper: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: "rgba(255,255,255,0.76)",
    marginBottom: 12,
  },

  blurCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  listContent: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 25,
    flexGrow: 1,
  },

  // ----------------------------------------------------------
  // USER ROW
  // ----------------------------------------------------------

  userRow: {
    minHeight: 132,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    gap: 14,
  },

  avatarContainer: {
    width: 86,
    height: 86,
    borderRadius: 43,
    overflow: "hidden",
    backgroundColor: "#E5EEFF",
    borderWidth: 1,
    borderColor: "#DCE8FF",
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 43,
  },

  avatarFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F0FF",
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  userName: {
    fontSize: 21,
    fontWeight: "500",
    color: PRIMARY_BLUE,
    letterSpacing: -0.4,
  },

  // ----------------------------------------------------------
  // UNBLOCK BUTTON
  // ----------------------------------------------------------

  unblockButton: {
    minWidth: 116,
    height: 60,
    paddingHorizontal: 17,
    borderRadius: 32,
    backgroundColor: "#E7EFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  unblockButtonPressed: {
    backgroundColor: "#D7E5FF",
    transform: [{ scale: 0.97 }],
  },

  unblockButtonDisabled: {
    opacity: 0.7,
  },

  unblockButtonText: {
    fontSize: 18,
    fontWeight: "500",
    color: ACCENT_BLUE,
  },

  // ----------------------------------------------------------
  // SEPARATOR
  // ----------------------------------------------------------

  separator: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    width: "100%",
  },

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },

  loadingText: {
    fontSize: 15,
    color: MUTED_TEXT,
  },

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  errorTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    textAlign: "center",
    marginTop: 20,
  },

  errorDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: MUTED_TEXT,
    textAlign: "center",
    marginTop: 10,
  },

  retryButton: {
    backgroundColor: "#E7EFFF",
    borderRadius: 25,
    paddingHorizontal: 35,
    paddingVertical: 14,
    marginTop: 24,
  },

  retryButtonPressed: {
    opacity: 0.7,
  },

  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: ACCENT_BLUE,
  },

  // ----------------------------------------------------------
  // EMPTY STATE
  // ----------------------------------------------------------

  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 40,
  },

  emptyIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EAF1FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: PRIMARY_BLUE,
    textAlign: "center",
  },

  emptyDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: MUTED_TEXT,
    textAlign: "center",
    marginTop: 9,
  },

  // ----------------------------------------------------------
  // MUTATION ERROR
  // ----------------------------------------------------------

  mutationErrorContainer: {
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },

  mutationErrorText: {
    fontSize: 13,
    color: "#C62828",
    textAlign: "center",
  },
});
