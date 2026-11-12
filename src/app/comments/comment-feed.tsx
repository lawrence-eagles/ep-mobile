import CommentActionSheet from "@/components/CommentActionSheet";
import CommentItem from "@/components/CommentItem";
import ErrorScreen from "@/components/Error";
import { useCommentsCrudMutations } from "@/hooks/useCommentsCrudMutations";
import { useCommentsInfiniteScroll } from "@/hooks/useCommentsInfiniteScroll";
import { useCommentsMutations } from "@/hooks/useCommentsMutations";
import { authClient } from "@/lib/auth-client";
import { getEnv } from "@/lib/env";
import type { Comment, SelectedCommentAction } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ================= TYPES =================

interface BlockUserResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// ================= MAIN COMPONENT =================

export default function CommentScreen() {
  const router = useRouter();

  const queryClient = useQueryClient();

  const params = useLocalSearchParams();

  const postId = Array.isArray(params.postId)
    ? params.postId[0]
    : params.postId;

  const API_BASE_URL = getEnv().BACKEND_URL;

  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Currently selected comment or reply for the action sheet.
  const [selectedAction, setSelectedAction] =
    useState<SelectedCommentAction | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useCommentsInfiniteScroll(postId ?? "");

  const { likeMutation, unlikeMutation } = useCommentsMutations(postId ?? "");

  const { createMutation, deleteMutation, updateMutation } =
    useCommentsCrudMutations({
      postId: postId ?? "",
      input,
      setInput,
      replyTo,
      setReplyTo,
    });

  const mutationError =
    createMutation.error?.message ||
    deleteMutation.error?.message ||
    updateMutation.error?.message;

  const isSendDisabled = !input.trim() || createMutation.isPending;

  // ================= MEMOIZED COMMENTS =================

  const comments = useMemo(() => {
    return data?.pages.flatMap((page) => page.comments) ?? [];
  }, [data]);

  // ================= COMMENT ACTION SHEET =================

  // Open the action sheet for the selected comment or reply.
  const handleOpenActionSheet = useCallback((item: SelectedCommentAction) => {
    setSelectedAction(item);
  }, []);

  // Close the action sheet.
  const handleCloseActionSheet = useCallback(() => {
    setSelectedAction(null);
  }, []);

  // ================= BLOCK USER =================

  /**
   * Calls the authenticated Eaglespress block-user API.
   *
   * After a successful block:
   * - Invalidates the current post's root comments query.
   * - Invalidates all reply queries belonging to the current post.
   * - Invalidates feed-related queries so blocked-user content can disappear.
   *
   * The backend must filter blocked users from all relevant endpoints.
   */
  const handleBlockUser = useCallback(
    async (userId: string): Promise<void> => {
      if (!userId) {
        throw new Error("Invalid user ID.");
      }

      const cookies = await authClient.getCookie();

      if (!cookies) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const baseUrl = API_BASE_URL.replace(/\/+$/, "");

      const response = await fetch(
        `${baseUrl}/api/v1/users/${encodeURIComponent(userId)}/block`,
        {
          method: "POST",
          headers: {
            Cookie: cookies,
            Accept: "application/json",
          },
          credentials: "omit",
        },
      );

      // Parse the response safely.
      let responseData: BlockUserResponse | null = null;

      try {
        responseData = (await response.json()) as BlockUserResponse;
      } catch {
        // A successful response does not necessarily need a JSON body.
        responseData = null;
      }

      if (!response.ok || responseData?.success === false) {
        throw new Error(
          responseData?.message ||
            responseData?.error ||
            `Failed to block user. Server returned ${response.status}.`,
        );
      }

      // ================================================
      // INVALIDATE COMMENT AND REPLY QUERIES
      // ================================================

      const invalidationPromises = [
        // Root comments for the current post.
        queryClient.invalidateQueries({
          queryKey: ["comments", postId],
        }),

        // All independently paginated replies for the current post.
        queryClient.invalidateQueries({
          queryKey: ["replies", postId],
        }),

        // ==============================================
        // INVALIDATE FEED-RELATED QUERIES
        // ==============================================

        // These prefixes should match the first element of
        // the corresponding TanStack Query keys in your app.
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
    [API_BASE_URL, postId, queryClient],
  );

  // ================= NAVIGATION ACTIONS =================

  // Navigate to the author's profile when their avatar is tapped.
  const handleUserProfilePress = useCallback(
    (userId: string) => {
      router.push({
        pathname: "/ugc/user-profile",
        params: {
          userId,
        },
      });
    },
    [router],
  );

  // ================= LIKE ACTION =================

  const handleLike = useCallback(
    (id: string, isLiked: boolean) => {
      if (isLiked) {
        unlikeMutation.mutate(id);
      } else {
        likeMutation.mutate(id);
      }
    },
    [likeMutation, unlikeMutation],
  );

  // ================= COMMENT ACTIONS =================

  const handleReplyPress = useCallback((commentId: string) => {
    setReplyTo(commentId);
  }, []);

  const handleEdit = useCallback(
    (commentId: string) => {
      updateMutation.mutate({
        id: commentId,
        content: input,
      });
    },
    [input, updateMutation],
  );

  const handleDelete = useCallback(
    (commentId: string) => {
      deleteMutation.mutate(commentId);
    },
    [deleteMutation],
  );

  // ================= ROOT COMMENT PAGINATION =================

  const handleLoadMoreComments = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // ================= RENDER COMMENT =================

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem
        comment={item}
        postId={postId ?? ""}
        onLongPress={handleOpenActionSheet}
        onProfilePress={handleUserProfilePress}
        onLike={handleLike}
        onReplyPress={handleReplyPress}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLikePending={likeMutation.isPending || unlikeMutation.isPending}
        isDeletePending={deleteMutation.isPending}
      />
    ),
    [
      postId,
      handleOpenActionSheet,
      handleUserProfilePress,
      handleLike,
      handleReplyPress,
      handleEdit,
      handleDelete,
      likeMutation.isPending,
      unlikeMutation.isPending,
      deleteMutation.isPending,
    ],
  );

  // ================= STATES =================

  if (!postId) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <View style={styles.center}>
          <Text>Invalid post</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ActivityIndicator style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (isError && comments.length === 0) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <ErrorScreen
          message={error?.message ?? "Error loading comments"}
          onRetry={refetch}
          retryAccessibilityLabel="Retry loading comments"
        />
      </SafeAreaView>
    );
  }

  // ================= RETURN =================

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {mutationError ? (
        <View style={{ padding: 10 }}>
          <Text style={{ color: "red" }}>{mutationError}</Text>
        </View>
      ) : null}

      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        onEndReachedThreshold={0.5}
        onEndReached={handleLoadMoreComments}
        initialNumToRender={10}
        windowSize={5}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>No comments yet</Text>
          </View>
        }
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator /> : null}
      />

      {/* INPUT + KEYBOARD FIX */}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={replyTo ? "Replying..." : "Add a comment..."}
            style={styles.input}
          />

          {/* Cancel reply */}
          {replyTo && (
            <Pressable
              onPress={() => setReplyTo(null)}
              accessibilityRole="button"
              accessibilityLabel="Cancel reply"
            >
              <Text style={{ marginRight: 8 }}>Cancel</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => createMutation.mutate()}
            disabled={isSendDisabled}
            accessibilityRole="button"
            accessibilityLabel="Send comment"
          >
            <Text>{createMutation.isPending ? "..." : "Send"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* COMMENT / REPLY ACTION SHEET */}

      {selectedAction ? (
        <CommentActionSheet
          visible={true}
          commentId={selectedAction.id}
          commentText={selectedAction.content}
          commentAuthorId={selectedAction.authorId}
          commentAuthorName={selectedAction.authorName}
          contentType={selectedAction.type}
          onClose={handleCloseActionSheet}
          onBlockUser={handleBlockUser}
        />
      ) : null}
    </SafeAreaView>
  );
}

// ================= STYLES =================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 10,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
