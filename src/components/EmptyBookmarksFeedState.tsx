import { EmptyUIProps } from "@/types";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const EmptyBookmarksFeedState = ({ isLoading }: EmptyUIProps) => {
  if (isLoading) return null;

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <Text style={styles.emptyTitle}>No posts yet</Text>

        <Text style={styles.emptySubtitle}>
          Go to your feed and bookmark posts or explore posts and bookmark them.
        </Text>

        <Pressable
          onPress={() => router.push("/(tabs)")}
          style={styles.emptyButton}
          accessibilityRole="button"
          accessibilityLabel="Update preferences"
        >
          <Text style={styles.emptyButtonText}>Go To Your Feed</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/explore")}
          style={[styles.emptyButton, styles.emptyExploreButton]}
          accessibilityRole="button"
          accessibilityLabel="Go to explore"
        >
          <Text style={styles.emptyButtonText}>Go To Explore</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default EmptyBookmarksFeedState;

// ==============================
// STYLES
// ==============================
const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyContent: {
    alignItems: "center",
    maxWidth: 320,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },

  emptySubtitle: {
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },

  emptyButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#000",
    borderRadius: 999,
  },
  emptyExploreButton: {
    backgroundColor: "#2563eb",
  },

  emptyButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
