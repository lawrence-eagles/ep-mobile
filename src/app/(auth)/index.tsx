import { authClient } from "@/lib/auth-client";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function AuthIndex() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // ✅ synchronous lock (prevents rapid multi-taps instantly)
  const authLock = useRef(false);

  const callbackURL = Linking.createURL("/");
  const newUserCallbackURL = Linking.createURL("/preferences/onboarding");

  /* ================= SOCIAL LOGIN ================= */
  const handleSocialLogin = async (
    provider: "google" | "apple" | "facebook",
  ) => {
    // ✅ hard guard (instant, no race condition)
    if (authLock.current) return;

    try {
      authLock.current = true;
      setLoadingProvider(provider);

      const { error } = await authClient.signIn.social({
        provider,
        callbackURL,
        newUserCallbackURL,
      });

      if (error) {
        Alert.alert("Login Error", error.message);
        authLock.current = false;
        setLoadingProvider(null);
        return;
      }

      // OAuth redirect will handle navigation
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Something went wrong");
      authLock.current = false;
      setLoadingProvider(null);
    }
  };

  /* ================= EMAIL LOGIN ================= */
  const handleEmailContinue = () => {
    if (authLock.current) return;

    authLock.current = true;

    router.push("/login");

    // unlock after navigation tick
    setTimeout(() => {
      authLock.current = false;
    }, 500);
  };

  const isLoading = loadingProvider !== null;

  /* ================= UI ================= */

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome to</Text>
          <Text style={styles.title}>Eaglespress</Text>
          <Text style={styles.subtitle}>Your AI powered news app</Text>
        </View>

        {/* HERO IMAGE */}
        <Image
          source={require("@/assets/images/auth-hero-img-crop.png")}
          style={styles.heroImage}
          contentFit="contain"
        />

        {/* BUTTONS */}
        <View
          style={[styles.buttonsContainer, isLoading && { opacity: 0.6 }]}
          pointerEvents={isLoading ? "none" : "auto"} // ✅ disables ALL touches
        >
          {/* GOOGLE */}
          <Pressable
            style={styles.socialButton}
            onPress={() => handleSocialLogin("google")}
          >
            {loadingProvider === "google" ? (
              <ActivityIndicator />
            ) : (
              <>
                <Image
                  source={require("@/assets/images/google-original.svg")}
                  style={styles.icon}
                  contentFit="contain"
                />
                <Text style={styles.buttonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {/* APPLE */}
          <Pressable
            style={styles.socialButton}
            onPress={() => handleSocialLogin("apple")}
          >
            {loadingProvider === "apple" ? (
              <ActivityIndicator />
            ) : (
              <>
                <Image
                  source={require("@/assets/images/apple-original.svg")}
                  style={styles.icon}
                  contentFit="contain"
                />
                <Text style={styles.buttonText}>Continue with Apple</Text>
              </>
            )}
          </Pressable>

          {/* FACEBOOK */}
          <Pressable
            style={styles.socialButton}
            onPress={() => handleSocialLogin("facebook")}
          >
            {loadingProvider === "facebook" ? (
              <ActivityIndicator />
            ) : (
              <>
                <Image
                  source={require("@/assets/images/facebook-original.svg")}
                  style={styles.icon}
                  contentFit="contain"
                />
                <Text style={styles.buttonText}>Continue with Facebook</Text>
              </>
            )}
          </Pressable>

          {/* EMAIL */}
          <Pressable style={styles.emailButton} onPress={handleEmailContinue}>
            <Text style={styles.emailButtonText}>Continue with Email</Text>
          </Pressable>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>
          By continuing, you agree to our{" "}
          <Text style={styles.link}>Terms & Privacy Policy</Text>
        </Text>
      </View>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 30,
    backgroundColor: "#fff",
  },

  container: {
    flex: 1,
  },

  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  welcome: {
    fontSize: 18,
    color: "#6b7280",
  },

  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#2563eb",
    marginVertical: 4,
  },

  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },

  heroImage: {
    width: "100%",
    height: 220,
    marginVertical: 20,
  },

  buttonsContainer: {
    marginTop: 10,
    gap: 12,
  },

  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 30,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: "#fff",
  },

  icon: {
    width: 20,
    height: 20,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },

  emailButton: {
    backgroundColor: "#2563eb",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },

  emailButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#6b7280",
    marginTop: 20,
  },

  link: {
    color: "#2563eb",
    fontWeight: "500",
  },
});
