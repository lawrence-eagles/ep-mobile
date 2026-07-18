import { useAuth } from "@/hooks/useAuth";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

export default function RootLayout() {
  const { isAuthenticated, isLoading, isError, error } = useAuth();

  // ⏳ Loading state
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  // ❌ Error state
  if (isError) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ textAlign: "center" }}>
          {error?.message ?? "Something went wrong"}
        </Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={"/(tabs)"} />;
  }

  return <Stack />;
}
