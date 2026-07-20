import { authClient } from "@/lib/auth-client";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

// ✅ Zod schema
const loginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [secureText, setSecureText] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const firstError = result.error.issues[0]?.message;
      Alert.alert("Validation Error", firstError || "Invalid input");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        Alert.alert("Login Error", error.message);
        return;
      }

      if (!data || !data.user.emailVerified) {
        router.replace({
          pathname: "/verify-email",
          params: { email },
        });
        return;
      }

      router.replace("/(tabs)");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>EP</Text>
          </View>

          <Text style={styles.title}>Eaglespress</Text>
          <Text style={styles.welcome}>Welcome back 👋</Text>
          <Text style={styles.subtitle}>
            Login to continue to your account.
          </Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          {/* Email */}
          <Text style={styles.label}>Email address</Text>
          <View style={styles.inputContainer}>
            <Image
              source={require("@/assets/images/envelop-icon.png")}
              style={styles.icon}
              contentFit="contain"
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

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Image
              source={require("@/assets/images/padlock-icon.png")}
              style={styles.icon}
              contentFit="contain"
            />
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
              style={styles.input}
            />

            <Pressable onPress={() => setSecureText((prev) => !prev)}>
              <Image
                source={
                  secureText
                    ? require("@/assets/images/closed-eye-icon.png")
                    : require("@/assets/images/open-eye-icon.png")
                }
                style={styles.eyeIcon}
                contentFit="contain"
              />
            </Pressable>
          </View>

          {/* Forgot password */}
          <Pressable
            onPress={() => router.push("/forgot-password")}
            style={styles.forgotContainer}
          >
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>

          {/* Login Button */}
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}
          </Pressable>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don&apos;t have an account?{" "}
              <Text
                style={styles.register}
                onPress={() => router.push("/register")}
              >
                Register
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 30,
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

  welcome: {
    fontSize: 18,
    marginTop: 10,
    fontWeight: "500",
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
    textAlign: "center",
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
    marginBottom: 16,
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

  eyeIcon: {
    width: 20,
    height: 20,
    opacity: 0.7,
  },

  forgotContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },

  forgot: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "500",
  },

  loginButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  footer: {
    marginTop: 20,
    alignItems: "center",
  },

  footerText: {
    fontSize: 14,
    color: "#6b7280",
  },

  register: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
