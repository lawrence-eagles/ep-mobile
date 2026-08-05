import { useCommentsCrudMutations } from "@/hooks/useCommentsCrudMutations";
import { useCommentsInfiniteScroll } from "@/hooks/useCommentsInfiniteScroll";
import { useCommentsMutations } from "@/hooks/useCommentsMutations";
import { Comment, Reply } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { Heart, MessageCircle, Pencil, Trash2 } from "lucide-react-native";
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

// ================= HELPERS =================

const getSafeTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
};

// ================= COMPONENT =================

export default function CommentScreen() {
  const params = useLocalSearchParams();
  const postId = Array.isArray(params.postId)
    ? params.postId[0]
    : params.postId;

  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
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

  // ✅ MEMOIZED
  const comments = useMemo(() => {
    return data?.pages.flatMap((page) => page.comments) ?? [];
  }, [data]);

  // ================= ACTIONS =================

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

  // ================= RENDER REPLY =================

  const renderReply = useCallback(
    (reply: Reply) => (
      <View key={reply.id} style={styles.replyContainer}>
        <Text style={styles.username}>{reply.userName}</Text>

        <Text>{reply.content}</Text>

        <View style={styles.actions}>
          <Pressable
            onPress={() => handleLike(reply.id, reply.isLiked)}
            disabled={likeMutation.isPending || unlikeMutation.isPending}
          >
            <Heart size={16} color={reply.isLiked ? "red" : "gray"} />
          </Pressable>

          <Text>{reply.likesCount}</Text>
        </View>
      </View>
    ),
    [handleLike, likeMutation.isPending, unlikeMutation.isPending],
  );

  // ================= RENDER COMMENT =================

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => (
      <View style={styles.card}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} />

        <View style={styles.row}>
          <Image
            source={{
              uri: item.userImage,
            }}
            style={styles.avatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{item.userName}</Text>

            <Text>{item.content}</Text>

            <Text style={styles.time}>{getSafeTimeAgo(item.created_at)}</Text>

            <View style={styles.actions}>
              <Pressable
                onPress={() => handleLike(item.id, item.isLiked)}
                disabled={likeMutation.isPending || unlikeMutation.isPending}
              >
                <Heart size={18} color={item.isLiked ? "red" : "gray"} />
              </Pressable>

              <Text>{item.likesCount}</Text>

              <Pressable onPress={() => setReplyTo(item.id)}>
                <MessageCircle size={18} />
              </Pressable>

              <Pressable
                onPress={() =>
                  updateMutation.mutate({
                    id: item.id,
                    content: input,
                  })
                }
              >
                <Pencil size={16} />
              </Pressable>

              <Pressable
                onPress={() => deleteMutation.mutate(item.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={16} color="red" />
              </Pressable>
            </View>

            {item.replies.length > 0 ? item.replies.map(renderReply) : null}
          </View>
        </View>
      </View>
    ),
    [
      handleLike,
      renderReply,
      likeMutation.isPending,
      unlikeMutation.isPending,
      deleteMutation.isPending,
      updateMutation,
      input,
    ],
  );

  // ================= STATES =================

  if (!postId) {
    return (
      <View style={styles.center}>
        <Text>Invalid post</Text>
      </View>
    );
  }

  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text>Error loading comments</Text>
        <Pressable onPress={() => refetch()}>
          <Text>Retry</Text>
        </Pressable>
      </View>
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
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
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

          {/* cancel reply */}
          {replyTo && (
            <Pressable onPress={() => setReplyTo(null)}>
              <Text style={{ marginRight: 8 }}>Cancel</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => createMutation.mutate()}
            disabled={isSendDisabled}
          >
            <Text>{createMutation.isPending ? "..." : "Send"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ================= STYLES =================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  card: {
    margin: 10,
    padding: 12,
    borderRadius: 16,
    overflow: "hidden",
  },

  row: { flexDirection: "row", gap: 10 },

  avatar: { width: 40, height: 40, borderRadius: 20 },

  username: { fontWeight: "600" },

  time: { color: "gray", fontSize: 12 },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    alignItems: "center",
  },

  replyContainer: {
    marginTop: 10,
    paddingLeft: 40,
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
