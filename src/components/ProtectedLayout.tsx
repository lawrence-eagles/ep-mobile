import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedLayout({ children }: Props) {
  const { user, isAuthenticated, isLoading, isError, error } = useAuth();

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

  // ❌ Not authenticated
  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)" />;
  }

  // ⚠️ Email not verified
  if (!user.emailVerified) {
    return <Redirect href="/verify-email" />;
  }

  // ✅ Fully authenticated + verified
  return <>{children}</>;
}
