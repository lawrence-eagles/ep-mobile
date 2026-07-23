import ProtectedLayout from "@/components/ProtectedLayout";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ✅ Shared constant
export const TAB_BAR_HEIGHT = 70;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // ✅ FIX: apply safe-area on ALL platforms
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <ProtectedLayout>
      <Tabs
        screenOptions={{
          headerShown: false,

          // 🎨 COLORS
          tabBarActiveTintColor: "#2563EB",
          tabBarInactiveTintColor: "#6B7280",

          // 🎯 STYLE (floating tab bar)
          tabBarStyle: {
            position: "absolute",

            // ✅ FIX: include safe area on all platforms
            height: TAB_BAR_HEIGHT + bottomInset,

            paddingTop: 8,
            paddingBottom: bottomInset,

            borderTopWidth: 0,
            elevation: 0,
            backgroundColor: "#FFFFFF",

            // subtle shadow
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
          },

          // 🧾 LABEL STYLE
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            marginTop: 2,
          },

          // 📏 ICON STYLE
          tabBarIconStyle: {
            marginBottom: -2,
          },

          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}
      >
        {/* 🏠 HOME */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size ?? 24}
                color={color}
              />
            ),
          }}
        />

        {/* 📈 TRENDING */}
        <Tabs.Screen
          name="trending"
          options={{
            title: "Trending",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "trending-up" : "trending-up-outline"}
                size={size ?? 24}
                color={color}
              />
            ),
          }}
        />

        {/* 🔍 EXPLORE */}
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "compass" : "compass-outline"}
                size={size ?? 24}
                color={color}
              />
            ),
          }}
        />

        {/* 🔖 BOOKMARKS */}
        <Tabs.Screen
          name="bookmarks"
          options={{
            title: "Bookmarks",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "bookmark" : "bookmark-outline"}
                size={size ?? 24}
                color={color}
              />
            ),
          }}
        />

        {/* 👥 FOLLOWING */}
        <Tabs.Screen
          name="following"
          options={{
            title: "Following",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={size ?? 24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </ProtectedLayout>
  );
}
