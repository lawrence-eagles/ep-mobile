import type { RepliesPageResponse } from "@/hooks/useRepliesInfiniteScroll";
import { useRepliesInfiniteScroll } from "@/hooks/useRepliesInfiniteScroll";
import type { Comment, SelectedCommentAction } from "@/types";
import { type InfiniteData } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react-native";
import { useCallback, useMemo } from "react";
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
  onProfilePress: (userId: string) => void;
  onLike: (id: string, isLiked: boolean) => void;
  onReplyPress: (commentId: string) => void;
  onEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  isLikePending: boolean;
  isDeletePending: boolean;
}

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
  // Each root comment owns an independent replies query.
  const repliesQuery = useRepliesInfiniteScroll(postId, comment.id);

  /*
   * useInfiniteQuery returns InfiniteData at runtime.
   * The supplied hook's third generic currently declares RepliesPageResponse
   * instead, so this assertion restores the correct infinite-data shape here.
   */

  const repliesData = repliesQuery.data as unknown as
    | InfiniteData<RepliesPageResponse, string | null>
    | undefined;

  const fetchedReplies = useMemo(
    () => repliesData?.pages.flatMap((page) => page.replies) ?? [],
    [repliesData],
  );

  /*
   * The root-comments endpoint already includes an initial set of replies.
   * Keep those visible while this comment's independent replies query loads.
   * Once the query has returned, use its paginated results.
   */
  const replies =
    repliesData !== undefined ? fetchedReplies : (comment.replies ?? []);

  const handleLoadMoreReplies = useCallback(() => {
    if (repliesQuery.hasNextPage && !repliesQuery.isFetchingNextPage) {
      void repliesQuery.fetchNextPage();
    }
  }, [
    repliesQuery.fetchNextPage,
    repliesQuery.hasNextPage,
    repliesQuery.isFetchingNextPage,
  ]);

  const handleLongPress = useCallback(() => {
    onLongPress({
      id: comment.id,
      type: "comment",
      content: comment.content,
      authorId: comment.user_id,
      authorName: comment.userName,
    });
  }, [onLongPress, comment]);

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
          onPress={() => onProfilePress(comment.user_id)}
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
              onPress={() => onEdit(comment.id)}
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
              onLike={onLike}
              isLikePending={isLikePending}
            />
          ))}

          {/* Initial replies loading indicator */}
          {repliesQuery.isLoading && replies.length === 0 ? (
            <ActivityIndicator style={styles.replyLoading} size="small" />
          ) : null}

          {/* Replies loading error */}
          {repliesQuery.isError && replies.length === 0 ? (
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

          {/* Load more replies */}
          {repliesQuery.hasNextPage ? (
            <Pressable
              style={styles.loadMoreReplies}
              onPress={handleLoadMoreReplies}
              disabled={repliesQuery.isFetchingNextPage}
              accessibilityRole="button"
              accessibilityLabel="Load more replies"
            >
              {repliesQuery.isFetchingNextPage ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={styles.loadMoreRepliesText}>
                  Load more replies
                </Text>
              )}
            </Pressable>
          ) : null}

          {/* Error while loading another replies page */}
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
