import type { Reply, SelectedCommentAction } from "@/types";
import { Image } from "expo-image";
import { Heart } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// ================= REPLY COMPONENT =================

interface ReplyItemProps {
  reply: Reply;
  onLongPress: (item: SelectedCommentAction) => void;
  onProfilePress: (userId: string, userImage: string, userName: string) => void;
  onLike: (id: string, isLiked: boolean) => void;
  isLikePending: boolean;
}

const ReplyItem = ({
  reply,
  onLongPress,
  onProfilePress,
  onLike,
  isLikePending,
}: ReplyItemProps) => {
  const handleLongPress = useCallback(() => {
    onLongPress({
      id: reply.id,
      type: "comment",
      content: reply.content,
      authorId: reply.user_id,
      authorName: reply.userName,
    });
  }, [onLongPress, reply]);

  return (
    <Pressable
      style={styles.replyContainer}
      onLongPress={handleLongPress}
      delayLongPress={450}
    >
      {/* Reply author's avatar */}
      <Pressable
        onPress={() =>
          onProfilePress(reply.user_id, reply.userImage, reply.userName)
        }
        accessibilityRole="button"
        accessibilityLabel={`View ${reply.userName}'s profile`}
      >
        <Image
          source={{
            uri: reply.userImage,
          }}
          style={styles.replyAvatar}
          contentFit="cover"
        />
      </Pressable>

      {/* Reply content */}
      <View style={styles.replyContent}>
        <Text style={styles.username}>{reply.userName}</Text>

        <Text>{reply.content}</Text>

        <View style={styles.actions}>
          <Pressable
            onPress={() => onLike(reply.id, reply.isLiked)}
            disabled={isLikePending}
            accessibilityRole="button"
            accessibilityLabel={reply.isLiked ? "Unlike reply" : "Like reply"}
          >
            <Heart size={16} color={reply.isLiked ? "red" : "gray"} />
          </Pressable>

          <Text>{reply.likesCount}</Text>
        </View>
      </View>
    </Pressable>
  );
};

// ================= STYLES =================

const styles = StyleSheet.create({
  username: {
    fontWeight: "600",
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
});

export default ReplyItem;
