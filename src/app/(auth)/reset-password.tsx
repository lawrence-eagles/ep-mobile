import { authClient } from "@/lib/auth-client";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

// ✅ Zod schema
const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "One uppercase letter")
  .regex(/[a-z]/, "One lowercase letter")
  .regex(/[0-9!@#$%^&*]/, "One number or special character");

export default function ResetPassword() {
  const params = useLocalSearchParams();

  const token = typeof params?.token === "string" ? params.token : undefined;
  const errorParam =
    typeof params?.error === "string" ? params.error : undefined;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ Password checks (live UI)
  const passwordChecks = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      special: /[0-9!@#$%^&*]/.test(password),
    };
  }, [password]);

  // ✅ Handle missing token and redirect errors
  useEffect(() => {
    if (errorParam) {
      if (errorParam === "invalid_token") {
        Alert.alert("Invalid link", "This reset link is invalid.");
      } else if (errorParam === "expired_token") {
        Alert.alert("Expired link", "This reset link has expired.");
      } else {
        Alert.alert("Error", "Something went wrong.");
      }
      router.replace("/forgot-password");
    } else if (!token) {
      Alert.alert("Error", "Invalid or missing token.");
      router.replace("/forgot-password");
    }
  }, [errorParam, token]);

  const handleResetPassword = async () => {
    const parsed = passwordSchema.safeParse(password);

    if (!parsed.success) {
      Alert.alert(
        "Weak password",
        parsed.error.issues[0]?.message ?? "Invalid password",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (!token) return;

    setLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message || "Something went wrong");
      return;
    }

    Alert.alert("Success", "Password reset successfully");
    router.replace("/login?reset=success");
  };

  return (
    <View style={styles.container}>
      {/* Background wave */}
      {/* <Image
        source={require("@/assets/images/wave.png")}
        style={styles.wave}
        contentFit="cover"
      /> */}

      {/* Back */}
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color="#0f172a" />
      </Pressable>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>EP</Text>
        </View>
        <Text style={styles.brand}>Eaglespress</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>Enter your new password below.</Text>

      {/* Password */}
      <View style={styles.group}>
        <Text style={styles.label}>New password</Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />

          <TextInput
            placeholder="Enter new password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
          />

          <Pressable onPress={() => setShowPassword((v) => !v)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#94a3b8"
            />
          </Pressable>
        </View>

        {/* Rules */}
        <View style={styles.rules}>
          <Rule text="At least 8 characters" valid={passwordChecks.length} />
          <Rule text="One uppercase letter" valid={passwordChecks.upper} />
          <Rule text="One lowercase letter" valid={passwordChecks.lower} />
          <Rule
            text="One number or special character"
            valid={passwordChecks.special}
          />
        </View>
      </View>

      {/* Confirm */}
      <View style={styles.group}>
        <Text style={styles.label}>Confirm password</Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />

          <TextInput
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            style={styles.input}
          />

          <Pressable onPress={() => setShowConfirm((v) => !v)}>
            <Ionicons
              name={showConfirm ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#94a3b8"
            />
          </Pressable>
        </View>
      </View>

      {/* Button */}
      <Pressable
        onPress={handleResetPassword}
        disabled={loading}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.buttonText}>
          {loading ? "Resetting..." : "Reset Password"}
        </Text>
      </Pressable>
    </View>
  );
}

/* Rule */
function Rule({ text, valid }: { text: string; valid: boolean }) {
  return (
    <View style={styles.ruleRow}>
      <Ionicons
        name="checkmark-circle"
        size={18}
        color={valid ? "#22c55e" : "#cbd5f5"}
      />
      <Text style={[styles.ruleText, valid && { color: "#22c55e" }]}>
        {text}
      </Text>
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 24,
  },
  wave: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 220,
  },
  back: {
    marginTop: 40,
    marginBottom: 10,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2563eb",
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: 20,
  },
  group: {
    marginTop: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
  },
  rules: {
    marginTop: 10,
    gap: 6,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ruleText: {
    color: "#64748b",
    fontSize: 13,
  },
  button: {
    marginTop: 32,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#2563eb",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
