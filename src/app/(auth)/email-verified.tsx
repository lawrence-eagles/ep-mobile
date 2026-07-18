import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function EmailVerified() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const hasHandled = useRef(false);

  const error = params?.error as string | undefined;

  useEffect(() => {
    if (hasHandled.current) return;
    hasHandled.current = true;

    const timer = setTimeout(() => {
      if (!error) return; // only auto-redirect on error

      switch (error) {
        case "invalid_token":
          router.replace("/login?error=invalid_token");
          break;

        case "expired_token":
          router.replace("/login?error=expired_token");
          break;

        default:
          router.replace("/login?error=unknown");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [error, router]);

  const handleContinue = () => {
    if (error) {
      router.replace("/login");
    } else {
      router.replace("/preferences/onboarding");
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <Image
        source={require("@/assets/images/email-verified-hero-crop.png")}
        style={styles.hero}
        contentFit="contain"
      />

      {/* Title */}
      <Text style={styles.title}>
        {error ? "Verification Failed" : "Email verified!"}
      </Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        {error
          ? getErrorMessage(error)
          : "Your email has been successfully verified.\nYou can now access all features."}
      </Text>

      {/* Button */}
      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>
          {error ? "Back to Login" : "Continue to App"}
        </Text>
      </Pressable>

      {/* Loader (only for error auto redirect) */}
      {error && <ActivityIndicator style={styles.loader} />}
    </View>
  );
}

// Helper
function getErrorMessage(error: string) {
  switch (error) {
    case "invalid_token":
      return "This verification link is invalid.";

    case "expired_token":
      return "This verification link has expired.";

    default:
      return "Something went wrong. Please try again.";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  hero: {
    width: 220,
    height: 220,
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
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },

  button: {
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
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  loader: {
    marginTop: 20,
  },
});
