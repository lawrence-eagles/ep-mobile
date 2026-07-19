import { authClient } from "@/lib/auth-client";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState } from "react";
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

  const callbackURL = Linking.createURL("/");
  const newUserCallbackURL = Linking.createURL("/preferences/onboarding");

  // ✅ Handle social login dynamically
  const handleSocialLogin = async (
    provider: "google" | "apple" | "facebook",
  ) => {
    if (loadingProvider !== null) return;

    try {
      setLoadingProvider(provider);

      const { error } = await authClient.signIn.social({
        provider,
        callbackURL,
        newUserCallbackURL,
      });

      if (error) {
        Alert.alert("Login Error", error.message);
        return;
      }

      // OAuth redirect will handle navigation
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Something went wrong");
    } finally {
      setLoadingProvider(null);
    }
  };

  // ✅ Continue with email
  const handleEmailContinue = () => {
    router.push("/login");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
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
        <View style={styles.buttonsContainer}>
          {/* Google */}
          <Pressable
            style={styles.socialButton}
            onPress={() => handleSocialLogin("google")}
            disabled={loadingProvider !== null}
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

          {/* Apple */}
          <Pressable
            style={styles.socialButton}
            onPress={() => handleSocialLogin("apple")}
            disabled={loadingProvider !== null}
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

          {/* Facebook */}
          <Pressable
            style={styles.socialButton}
            onPress={() => handleSocialLogin("facebook")}
            disabled={loadingProvider !== null}
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

          {/* Email CTA */}
          <Pressable
            style={styles.emailButton}
            onPress={handleEmailContinue}
            disabled={loadingProvider !== null}
          >
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
