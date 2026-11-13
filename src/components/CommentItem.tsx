import { useRepliesInfiniteScroll } from "@/hooks/useRepliesInfiniteScroll";
import type { Comment, SelectedCommentAction } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ReplyItem from "./ReplyItem";

// ================= HELPERS =================

const getSafeTimeAgo = (dateString: string) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "";

  return formatDistanceToNow(date, { addSuffix: true });
};

// ================= COMMENT ITEM COMPONENT =================

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onLongPress: (item: SelectedCommentAction) => void;
  onProfilePress: (userId: string, userImage: string, userName: string) => void;
  onLike: (id: string, isLiked: boolean) => void | Promise<void>;
  onReplyPress: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  isLikePending: boolean;
  isDeletePending: boolean;
}

/**
 * The root comments response supplies an initial set of replies and
 * pagination metadata. The cursor must point to the page after those
 * embedded replies.
 */
type CommentWithReplyPagination = Comment & {
  repliesNextCursor?: string | null;
};

const CommentItem = ({
  comment,
  postId,
  onLongPress,
  onProfilePress,
  onLike,
  onReplyPress,
  onEdit,
  onDelete,
  isLikePending,
  isDeletePending,
}: CommentItemProps) => {
  const queryClient = useQueryClient();

  const [shouldFetchMoreReplies, setShouldFetchMoreReplies] = useState(false);

  // The cursor must come from the root comments response.
  const initialCursor =
    (comment as CommentWithReplyPagination).repliesNextCursor ?? null;

  // Each root comment owns an independent replies query.
  // The query remains disabled until the user requests additional replies.
  // initialCursor is part of the query key inside the hook.
  const repliesQuery = useRepliesInfiniteScroll(postId, comment.id, {
    enabled: shouldFetchMoreReplies,
    initialCursor,
  });

  /**
   * Prefix query key.
   *
   * Deliberately excludes initialCursor because the hook now includes
   * initialCursor in its complete query key.
   *
   * Omitting exact: true allows invalidation of every cursor variant
   * belonging to this post and parent comment.
   */
  const repliesQueryKey = useMemo(
    () => ["replies", postId, comment.id] as const,
    [postId, comment.id],
  );

  // ================= EMBEDDED + FETCHED REPLIES =================

  const fetchedReplies = useMemo(
    () => repliesQuery.data?.pages.flatMap((page) => page.replies) ?? [],
    [repliesQuery.data],
  );

  /**
   * Keep embedded replies visible while additional pages are fetched.
   *
   * IMPORTANT:
   * 1. Insert embedded replies first to preserve their original order.
   * 2. Append fetched replies only when their IDs are not already present.
   * 3. Embedded replies take precedence when duplicate IDs exist.
   *
   * Example:
   * Embedded: [A, B]
   * Fetched:  [C, D]
   * Result:   [A, B, C, D]
   */
  const replies = useMemo(() => {
    const repliesById = new Map(
      (comment.replies ?? []).map((reply) => [reply.id, reply]),
    );

    for (const reply of fetchedReplies) {
      if (!repliesById.has(reply.id)) {
        repliesById.set(reply.id, reply);
      }
    }

    return Array.from(repliesById.values());
  }, [comment.replies, fetchedReplies]);

  // ================= REFRESH AFTER REPLY WRITES =================

  /**
   * The parent comments query is refreshed after creating a reply.
   * When its embedded replies change, invalidate this independent
   * replies query too, provided the user has already activated it.
   *
   * Skip the initial render so mounting CommentItem does not trigger
   * an unnecessary replies-query invalidation.
   */
  const previousEmbeddedReplies = useRef(comment.replies);

  useEffect(() => {
    const previousReplies = previousEmbeddedReplies.current;

    previousEmbeddedReplies.current = comment.replies;

    if (previousReplies === comment.replies || !shouldFetchMoreReplies) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: repliesQueryKey,
    });
  }, [comment.replies, queryClient, repliesQueryKey, shouldFetchMoreReplies]);

  /**
   * ReplyItem uses this handler for reply likes.
   *
   * Wait for the parent mutation callback to settle before invalidating
   * the corresponding replies queries.
   */
  const handleReplyLike = useCallback(
    async (replyId: string, isLiked: boolean) => {
      try {
        await onLike(replyId, isLiked);
      } finally {
        await queryClient.invalidateQueries({
          queryKey: repliesQueryKey,
        });
      }
    },
    [onLike, queryClient, repliesQueryKey],
  );

  // ================= LOAD MORE REPLIES =================

  const handleLoadMoreReplies = useCallback(() => {
    // The first independent page has not been fetched yet.
    // Enabling the query starts it using initialCursor.
    if (!shouldFetchMoreReplies) {
      if (initialCursor) {
        setShouldFetchMoreReplies(true);
      }

      return;
    }

    // Subsequent pages.
    if (repliesQuery.hasNextPage && !repliesQuery.isFetchingNextPage) {
      void repliesQuery.fetchNextPage();
    }
  }, [
    shouldFetchMoreReplies,
    initialCursor,
    repliesQuery.hasNextPage,
    repliesQuery.isFetchingNextPage,
    repliesQuery.fetchNextPage,
  ]);

  // ================= COMMENT ACTIONS =================

  const handleLongPress = useCallback(() => {
    onLongPress({
      id: comment.id,
      type: "comment",
      content: comment.content,
      authorId: comment.user_id,
      authorName: comment.userName,
    });
  }, [onLongPress, comment]);

  // ================= RENDER =================

  const isInitialRepliesLoading =
    shouldFetchMoreReplies && repliesQuery.isLoading && !repliesQuery.data;

  const hasRepliesQueryError = shouldFetchMoreReplies && repliesQuery.isError;

  const canLoadMoreReplies =
    Boolean(initialCursor) &&
    !repliesQuery.isError &&
    (!shouldFetchMoreReplies || repliesQuery.hasNextPage);

  return (
    <Pressable
      style={styles.card}
      onLongPress={handleLongPress}
      delayLongPress={450}
    >
      <BlurView intensity={30} style={StyleSheet.absoluteFill} />

      <View style={styles.row}>
        {/* Comment author's avatar */}
        <Pressable
          onPress={() =>
            onProfilePress(comment.user_id, comment.userImage, comment.userName)
          }
          accessibilityRole="button"
          accessibilityLabel={`View ${comment.userName}'s profile`}
        >
          <Image
            source={{
              uri: comment.userImage,
            }}
            style={styles.avatar}
            contentFit="cover"
          />
        </Pressable>

        <View style={styles.commentContent}>
          <Text style={styles.username}>{comment.userName}</Text>

          <Text>{comment.content}</Text>

          <Text style={styles.time}>{getSafeTimeAgo(comment.created_at)}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={() => onReplyPress(comment.id)}
              accessibilityRole="button"
              accessibilityLabel="Reply to comment"
            >
              <MessageCircle size={18} />
            </Pressable>

            <Pressable
              onPress={() => onLike(comment.id, comment.isLiked)}
              disabled={isLikePending}
              accessibilityRole="button"
              accessibilityLabel={
                comment.isLiked ? "Unlike comment" : "Like comment"
              }
            >
              <Heart size={18} color={comment.isLiked ? "red" : "gray"} />
            </Pressable>

            <Text>{comment.likesCount}</Text>

            <Pressable
              onPress={() => onEdit(comment.id, comment.content)}
              accessibilityRole="button"
              accessibilityLabel="Edit comment"
            >
              <Pencil size={16} />
            </Pressable>

            <Pressable
              onPress={() => onDelete(comment.id)}
              disabled={isDeletePending}
              accessibilityRole="button"
              accessibilityLabel="Delete comment"
            >
              <Trash2 size={16} color="red" />
            </Pressable>
          </View>

          {/* Replies */}
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              onLongPress={onLongPress}
              onProfilePress={onProfilePress}
              onLike={handleReplyLike}
              isLikePending={isLikePending}
            />
          ))}

          {/* Initial independent replies-page loading indicator */}
          {isInitialRepliesLoading ? (
            <ActivityIndicator style={styles.replyLoading} size="small" />
          ) : null}

          {/* Replies query error and retry.
              This remains visible even when embedded replies exist. */}
          {hasRepliesQueryError ? (
            <View style={styles.replyErrorContainer}>
              <Text style={styles.replyErrorText}>
                {repliesQuery.error?.message ?? "Error loading replies"}
              </Text>

              <Pressable
                onPress={() => void repliesQuery.refetch()}
                accessibilityRole="button"
                accessibilityLabel="Retry loading replies"
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Load the first independent page or another page */}
          {canLoadMoreReplies ? (
            <Pressable
              style={styles.loadMoreReplies}
              onPress={handleLoadMoreReplies}
              disabled={
                isInitialRepliesLoading || repliesQuery.isFetchingNextPage
              }
              accessibilityRole="button"
              accessibilityLabel="Load more replies"
            >
              {isInitialRepliesLoading || repliesQuery.isFetchingNextPage ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={styles.loadMoreRepliesText}>
                  Load more replies
                </Text>
              )}
            </Pressable>
          ) : null}

          {/* Error while loading a subsequent page */}
          {repliesQuery.isFetchNextPageError ? (
            <Pressable
              onPress={handleLoadMoreReplies}
              accessibilityRole="button"
              accessibilityLabel="Retry loading more replies"
            >
              <Text style={styles.retryText}>
                Could not load more replies. Retry
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

// ================= STYLES =================
// Existing styles preserved.

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  card: {
    margin: 10,
    padding: 12,
    borderRadius: 16,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  username: {
    fontWeight: "600",
  },

  time: {
    color: "gray",
    fontSize: 12,
  },

  commentContent: {
    flex: 1,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    alignItems: "center",
  },

  replyContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 10,
    paddingLeft: 20,
  },

  replyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  replyContent: {
    flex: 1,
  },

  replyLoading: {
    marginTop: 10,
    alignSelf: "flex-start",
  },

  replyErrorContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  replyErrorText: {
    color: "red",
    fontSize: 12,
  },

  retryText: {
    color: "#2563eb",
    fontSize: 12,
    marginTop: 8,
  },

  loadMoreReplies: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingVertical: 4,
  },

  loadMoreRepliesText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
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

export default CommentItem;
