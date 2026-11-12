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

  // New-comment composer state.
  const [input, setInput] = useState("");

  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Dedicated edit state. Never share this with the new-comment composer.
  const [editInput, setEditInput] = useState("");

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

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

  const handleOpenActionSheet = useCallback((item: SelectedCommentAction) => {
    setSelectedAction(item);
  }, []);

  const handleCloseActionSheet = useCallback(() => {
    setSelectedAction(null);
  }, []);

  // ================= BLOCK USER =================

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

      const invalidationPromises = [
        queryClient.invalidateQueries({
          queryKey: ["comments", postId],
        }),

        queryClient.invalidateQueries({
          queryKey: ["replies", postId],
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
    [API_BASE_URL, postId, queryClient],
  );

  // ================= NAVIGATION ACTIONS =================

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

  /**
   * Load the selected comment's existing content into a dedicated
   * edit state instead of using the new-comment composer.
   */
  const handleEdit = useCallback(
    (commentId: string, currentContent: string) => {
      if (!commentId) {
        return;
      }

      setEditingCommentId(commentId);
      setEditInput(currentContent);
    },
    [],
  );

  /**
   * Submit the dedicated edit value.
   * The shared new-comment input is never used here.
   */
  const handleSubmitEdit = useCallback(() => {
    if (!editingCommentId || !editInput.trim() || updateMutation.isPending) {
      return;
    }

    updateMutation.mutate({
      id: editingCommentId,
      content: editInput.trim(),
    });
  }, [editingCommentId, editInput, updateMutation]);

  const handleCancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditInput("");
  }, []);

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

      {/* COMMENT EDITOR */}

      {editingCommentId ? (
        <View style={styles.editContainer}>
          <TextInput
            value={editInput}
            onChangeText={setEditInput}
            placeholder="Edit your comment..."
            style={styles.editInput}
            multiline
            editable={!updateMutation.isPending}
          />

          <View style={styles.editActions}>
            <Pressable
              onPress={handleCancelEdit}
              disabled={updateMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
            >
              <Text>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmitEdit}
              disabled={!editInput.trim() || updateMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Save edited comment"
            >
              <Text>{updateMutation.isPending ? "Saving..." : "Save"}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

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

  editContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  editInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 10,
    textAlignVertical: "top",
  },

  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 16,
    marginTop: 10,
  },
});
