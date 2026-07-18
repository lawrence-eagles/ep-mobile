import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const ErrorScreen = () => {
  const router = useRouter();

  const handleRetry = () => {
    router.replace("/(tabs)"); // 🔁 Adjust if you want a specific retry route
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)"); // fallback
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Illustration */}
      <Image
        source={require("../../assets/images/error-hero-crop.png")}
        style={styles.hero}
        contentFit="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Oops! Something went wrong</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        An error occured while processing your request.
        {"\n"}
        Please check your internet connection and
        {"\n"}
        try again.
      </Text>

      {/* Primary Button */}
      <Pressable style={styles.primaryButton} onPress={handleRetry}>
        <Text style={styles.primaryButtonText}>Try Again</Text>
      </Pressable>

      {/* Secondary Button */}
      <Pressable onPress={handleGoBack} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Go Back</Text>
      </Pressable>
    </View>
  );
};

export default ErrorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  hero: {
    width: 240,
    height: 240,
    marginBottom: 32,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },

  primaryButton: {
    width: "100%",
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 16,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  secondaryButton: {
    paddingVertical: 8,
  },

  secondaryButtonText: {
    fontSize: 16,
    color: "#2563EB",
    fontWeight: "500",
  },
});
