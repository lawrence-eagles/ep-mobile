import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import { useRouter, type Href } from "expo-router";
import { Ban, Copy, TriangleAlert } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ============================================================
// TYPES
// ============================================================

export type CommentContentType = "comment" | "reply";

export interface CommentActionSheetProps {
  /**
   * Controls whether the action sheet is visible.
   */
  visible: boolean;

  /**
   * ID of the selected comment or reply.
   */
  commentId: string;

  /**
   * Text of the selected comment or reply.
   */
  commentText: string;

  /**
   * ID of the user who authored the selected comment or reply.
   */
  commentAuthorId: string;

  /**
   * Optional name of the comment author.
   * Used when displaying the block confirmation.
   */
  commentAuthorName?: string;

  /**
   * Identifies whether the selected content is a comment or reply.
   */
  contentType?: CommentContentType;

  /**
   * Called when the sheet should close.
   */
  onClose: () => void;

  /**
   * Executes the authenticated block-user operation.
   *
   * The parent should call the existing Eaglespress
   * block-user API/service here.
   */
  onBlockUser: (userId: string) => Promise<void>;

  /**
   * Optional callback after successfully copying content.
   */
  onCopySuccess?: () => void;

  /**
   * Optional callback after successfully blocking a user.
   */
  onBlockSuccess?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

const CommentActionSheet = ({
  visible,
  commentId,
  commentText,
  commentAuthorId,
  commentAuthorName,
  contentType = "comment",
  onClose,
  onBlockUser,
  onCopySuccess,
  onBlockSuccess,
}: CommentActionSheetProps) => {
  const router = useRouter();

  const { width, height } = useWindowDimensions();

  const [isBlocking, setIsBlocking] = useState(false);

  // ==========================================================
  // RESPONSIVE DIMENSIONS
  // ==========================================================

  const horizontalPadding = Math.min(width * 0.055, 24);

  const iconCircleSize = Math.min(Math.max(width * 0.19, 64), 88);

  const iconSize = Math.min(Math.max(width * 0.09, 32), 42);

  // ==========================================================
  // RESET LOADING STATE WHEN THE SHEET CLOSES
  // ==========================================================

  useEffect(() => {
    if (!visible) {
      setIsBlocking(false);
    }
  }, [visible]);

  // ==========================================================
  // CLOSE ACTION SHEET
  // ==========================================================

  const handleClose = useCallback(() => {
    if (isBlocking) {
      return;
    }

    onClose();
  }, [isBlocking, onClose]);

  // ==========================================================
  // COPY COMMENT OR REPLY
  // ==========================================================

  const handleCopy = useCallback(async () => {
    if (isBlocking) {
      return;
    }

    try {
      await Clipboard.setStringAsync(commentText);

      onClose();

      onCopySuccess?.();

      Alert.alert(
        "Copied",
        `${contentType === "reply" ? "Reply" : "Comment"} copied to clipboard.`,
      );
    } catch (error) {
      console.error("[CommentActionSheet] Failed to copy content:", error);

      Alert.alert(
        "Unable to copy",
        "Something went wrong while copying this content. Please try again.",
      );
    }
  }, [commentText, contentType, isBlocking, onClose, onCopySuccess]);

  // ==========================================================
  // REPORT COMMENT OR REPLY
  // ==========================================================

  const handleReport = useCallback(() => {
    if (isBlocking) {
      return;
    }

    try {
      // Close the action sheet before navigating.
      onClose();

      router.push({
        pathname: "/ugc/report-comment",
        params: {
          commentId,
          reportedUserId: commentAuthorId,
          contentType,
        },
      } as Href);
    } catch (error) {
      console.error("[CommentActionSheet] Report navigation failed:", error);

      Alert.alert(
        "Unable to continue",
        "Could not open the report screen. Please try again.",
      );
    }
  }, [commentId, commentAuthorId, contentType, isBlocking, onClose, router]);

  // ==========================================================
  // EXECUTE BLOCK USER OPERATION
  // ==========================================================

  const executeBlock = useCallback(async () => {
    if (isBlocking) {
      return;
    }

    setIsBlocking(true);

    try {
      await onBlockUser(commentAuthorId);

      onClose();

      onBlockSuccess?.();

      Alert.alert(
        "User blocked",
        `${commentAuthorName || "This user"} has been blocked successfully.`,
      );
    } catch (error) {
      console.error("[CommentActionSheet] Failed to block user:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while blocking this user.";

      Alert.alert("Unable to block user", message);
    } finally {
      setIsBlocking(false);
    }
  }, [
    commentAuthorId,
    commentAuthorName,
    isBlocking,
    onBlockUser,
    onBlockSuccess,
    onClose,
  ]);

  // ==========================================================
  // BLOCK CONFIRMATION
  // ==========================================================

  const handleBlock = useCallback(() => {
    if (isBlocking) {
      return;
    }

    Alert.alert(
      "Block user?",
      `Are you sure you want to block ${
        commentAuthorName || "this user"
      }? You will no longer see their content.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            void executeBlock();
          },
        },
      ],
      {
        cancelable: true,
      },
    );
  }, [commentAuthorName, executeBlock, isBlocking]);

  // ==========================================================
  // ACTION BUTTON
  // ==========================================================

  const renderActionButton = (
    label: string,
    Icon: typeof Copy,
    onPress: () => void,
    accessibilityLabel: string,
  ) => {
    return (
      <Pressable
        onPress={onPress}
        disabled={isBlocking}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{
          disabled: isBlocking,
        }}
        style={({ pressed }) => [
          styles.actionButton,
          {
            opacity: isBlocking ? 0.55 : pressed ? 0.75 : 1,
            borderRadius: 36,
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              width: iconCircleSize,
              height: iconCircleSize,
              borderRadius: iconCircleSize / 2,
            },
          ]}
        >
          <Icon size={iconSize} color="#0866E8" strokeWidth={2.7} />
        </View>

        <Text style={styles.actionLabel}>{label}</Text>
      </Pressable>
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        {/* ==================================================
            BLURRED BACKGROUND / DISMISSABLE BACKDROP
        ================================================== */}

        <BlurView
          intensity={30}
          tint="dark"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          disabled={isBlocking}
          accessibilityRole="button"
          accessibilityLabel="Close comment actions"
        />

        {/* ==================================================
            BOTTOM SHEET
        ================================================== */}

        <SafeAreaView
          edges={["bottom"]}
          style={[
            styles.sheetContainer,
            {
              paddingHorizontal: horizontalPadding,
              maxHeight: Math.min(height * 0.88, 800),
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
          >
            {/* DRAG INDICATOR */}

            <View style={styles.dragIndicatorContainer}>
              <View style={styles.dragIndicator} />
            </View>

            {/* HEADER */}

            <View style={styles.header}>
              <Text style={styles.title} accessibilityRole="header">
                Choose an action
              </Text>

              <Text style={styles.description}>
                Select what you want to do with this {contentType}.
              </Text>
            </View>

            {/* ACTION BUTTONS */}

            <View style={styles.actionsContainer}>
              {renderActionButton(
                "Copy",
                Copy,
                () => {
                  void handleCopy();
                },
                `Copy ${contentType}`,
              )}

              {renderActionButton(
                "Report",
                TriangleAlert,
                handleReport,
                `Report ${contentType}`,
              )}

              {renderActionButton(
                "Block",
                Ban,
                handleBlock,
                `Block ${commentAuthorName || "comment author"}`,
              )}
            </View>

            {/* CANCEL BUTTON */}

            <Pressable
              onPress={handleClose}
              disabled={isBlocking}
              accessibilityRole="button"
              accessibilityLabel="Cancel and close action sheet"
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  opacity: isBlocking ? 0.55 : pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13, 30, 65, 0.34)",
  },

  // ----------------------------------------------------------
  // BOTTOM SHEET
  // ----------------------------------------------------------

  sheetContainer: {
    width: "100%",
    alignSelf: "stretch",
    backgroundColor: "#FFFFFF",

    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,

    borderWidth: 1,
    borderColor: "#DCE8FF",

    overflow: "hidden",

    shadowColor: "#1456B8",
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,

    elevation: 20,
  },

  sheetContent: {
    paddingTop: 22,
    paddingBottom: 12,
  },

  // ----------------------------------------------------------
  // DRAG INDICATOR
  // ----------------------------------------------------------

  dragIndicatorContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 42,
  },

  dragIndicator: {
    width: 108,
    height: 12,
    borderRadius: 20,
    backgroundColor: "#B7C6E2",
  },

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginBottom: 26,
  },

  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    color: "#101C59",
    textAlign: "center",
    letterSpacing: -0.7,
    marginBottom: 12,
  },

  description: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "400",
    color: "#414BC7",
    textAlign: "center",
  },

  // ----------------------------------------------------------
  // ACTION BUTTONS
  // ----------------------------------------------------------

  actionsContainer: {
    width: "100%",
    gap: 16,
    marginBottom: 28,
  },

  actionButton: {
    width: "100%",
    minHeight: 116,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 42,

    backgroundColor: "#FFFFFF",

    borderWidth: 1.5,
    borderColor: "#E0EBFF",
  },

  iconContainer: {
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E7F0FF",

    flexShrink: 0,
  },

  actionLabel: {
    flex: 1,
    marginLeft: 52,

    fontSize: 27,
    lineHeight: 35,
    fontWeight: "700",

    color: "#101C59",
    letterSpacing: -0.5,
  },

  // ----------------------------------------------------------
  // CANCEL BUTTON
  // ----------------------------------------------------------

  cancelButton: {
    width: "100%",
    minHeight: 100,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 60,

    backgroundColor: "#E4EEFF",
  },

  cancelLabel: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "700",
    color: "#0866E8",
    letterSpacing: -0.4,
  },
});

export default CommentActionSheet;
