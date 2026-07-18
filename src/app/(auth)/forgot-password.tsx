import { authClient } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

/* ================= VALIDATION ================= */

const schema = z.object({
  email: z.email("Please enter a valid email"),
});

/* ================= COMPONENT ================= */

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const params = useLocalSearchParams();
  const error = params?.error as string | undefined;

  /* ================= HANDLE REDIRECT ERRORS ================= */

  useEffect(() => {
    if (!error) return;

    switch (error) {
      case "invalid_token":
        Alert.alert("Invalid link", "This reset link is invalid.");
        break;
      case "expired_token":
        Alert.alert("Expired link", "This reset link has expired.");
        break;
      default:
        Alert.alert("Error", "Something went wrong.");
    }
  }, [error]);

  /* ================= HANDLER ================= */

  const handleForgotPassword = async () => {
    const result = schema.safeParse({ email });

    if (!result.success) {
      const msg = result.error.issues[0]?.message;
      Alert.alert("Validation Error", msg || "Invalid email");
      return;
    }

    try {
      setLoading(true);

      const callbackURL = Linking.createURL("/reset-password");

      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: callbackURL,
      });

      if (error) {
        Alert.alert("Error", error.message || "Something went wrong");
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* BACK BUTTON */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        {/* <Text style={styles.backText}>←</Text> */}
        <Ionicons name="arrow-back" size={24} color="#0f172a" />
      </Pressable>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>EP</Text>
        </View>

        <Text style={styles.title}>Eaglespress</Text>

        {!success ? (
          <>
            <Text style={styles.heading}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter your email address and we will send you a link
              to reset your password.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.heading}>Check your email</Text>
            <Text style={styles.subtitle}>
              We have sent a password reset link to your email.
            </Text>
          </>
        )}
      </View>

      {/* CONTENT */}
      {!success ? (
        <View style={styles.form}>
          {/* EMAIL */}
          <Text style={styles.label}>Email address</Text>
          <View style={styles.inputContainer}>
            <Image
              source={require("@/assets/images/envelop-icon.png")}
              style={styles.icon}
              contentFit="contain" // added
            />
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          {/* BUTTON */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.successContainer}>
          <Image
            source={require("@/assets/images/forgot-password-envolope-crop.png")}
            style={styles.successImage}
            contentFit="contain"
          />
          <Text>Check your email for a password reset link.</Text>
        </View>
      )}

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Remember your password?{" "}
          <Text style={styles.link} onPress={() => router.push("/login")}>
            Login
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 24,
    paddingTop: 70,
  },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },

  backText: {
    fontSize: 24,
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  logoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2563eb",
  },

  heading: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },

  form: {
    marginTop: 20,
  },

  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    height: 52,
    fontSize: 14,
  },

  icon: {
    width: 20,
    height: 20,
    marginRight: 8,
    opacity: 0.7,
  },

  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  successContainer: {
    alignItems: "center",
    marginTop: 40,
  },

  successImage: {
    width: 180,
    height: 180,
    opacity: 0.9,
  },

  footer: {
    marginTop: "auto",
    marginBottom: 20,
    alignItems: "center",
  },

  footerText: {
    fontSize: 14,
    color: "#6b7280",
  },

  link: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
