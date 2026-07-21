import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ==============================
// ICON MAPPING
// ==============================
const getCategoryIcon = (name: string) => {
  switch (name.toLowerCase()) {
    case "general":
      return <Ionicons name="newspaper-outline" size={22} color="#3B82F6" />;
    case "technology":
      return <MaterialIcons name="memory" size={22} color="#22C55E" />;
    case "business":
      return <Ionicons name="briefcase-outline" size={22} color="#8B5CF6" />;
    case "politics":
      return <Ionicons name="business-outline" size={22} color="#EF4444" />;
    case "health":
      return <Ionicons name="heart-outline" size={22} color="#16A34A" />;
    case "world":
      return <Ionicons name="globe-outline" size={22} color="#3B82F6" />;
    case "crypto":
      return <FontAwesome5 name="bitcoin" size={20} color="#F59E0B" />;
    default:
      return <Ionicons name="apps-outline" size={22} color="#6B7280" />;
  }
};

// ==============================
// COMPONENT
// ==============================
const Onboarding = () => {
  const {
    categories,
    isLoading,
    isError,
    followMutation,
    unfollowMutation,
    isMutating,
    activeIds,
  } = useCategories();

  // ==============================
  // TOGGLE HANDLER
  // ==============================
  const handleToggle = useCallback(
    (item: Category) => {
      if (item.isFollowing) {
        unfollowMutation.mutate(item.id);
      } else {
        followMutation.mutate(item.id);
      }
    },
    [followMutation.mutate, unfollowMutation.mutate],
  );

  const selectedCount = categories.filter((c) => c.isFollowing).length;

  // ==============================
  // RENDER ITEM
  // ==============================
  const renderItem = useCallback(
    ({ item }: { item: Category }) => (
      <Pressable
        style={styles.card}
        onPress={() => handleToggle(item)}
        disabled={activeIds.has(item.id)}
      >
        <View style={styles.left}>
          <View style={styles.iconContainer}>{getCategoryIcon(item.name)}</View>
          <Text style={styles.categoryText}>{item.name}</Text>
        </View>

        <View
          style={[
            styles.checkbox,
            item.isFollowing && styles.checkboxActive,
            activeIds.has(item.id) && { opacity: 0.5 },
          ]}
        >
          {item.isFollowing && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
      </Pressable>
    ),
    [handleToggle, isMutating, activeIds],
  );

  // ==============================
  // UI STATES
  // ==============================
  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: "red" }}>Failed to load categories</Text>
      </SafeAreaView>
    );
  }

  // ==============================
  // MAIN UI
  // ==============================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>What are you interested in?</Text>
        <Text style={styles.subtitle}>
          Select categories you want to follow to personalize your feed.
        </Text>
      </View>

      {/* LIST */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        removeClippedSubviews
        initialNumToRender={10}
      />

      {/* FOOTER */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.button, selectedCount === 0 && styles.buttonDisabled]}
          disabled={selectedCount === 0}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/explore")}>
          <Text style={styles.skip}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Onboarding;

// ==============================
// STYLES
// ==============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skip: {
    textAlign: "center",
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "500",
  },
});
