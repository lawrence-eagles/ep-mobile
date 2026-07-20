import { authClient } from "@/lib/auth-client";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
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

/* ================= VALIDATION ================= */

const passwordRules = {
  minLength: (val: string) => val.length >= 8,
  upper: (val: string) => /[A-Z]/.test(val),
  lower: (val: string) => /[a-z]/.test(val),
  number: (val: string) => /[0-9]|[^A-Za-z0-9\s]/.test(val),
};

const registerSchema = z.object({
  name: z.string().trim().min(2, "Full name is required"),
  email: z.email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(passwordRules.upper, "Must include an uppercase letter")
    .refine(passwordRules.lower, "Must include a lowercase letter")
    .refine(passwordRules.number, "Must include a number or special character"),
});

/* ================= COMPONENT ================= */

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => {
    return {
      min: passwordRules.minLength(password),
      upper: passwordRules.upper(password),
      lower: passwordRules.lower(password),
      number: passwordRules.number(password),
    };
  }, [password]);

  const handleRegister = async () => {
    const result = registerSchema.safeParse({ name, email, password });

    if (!result.success) {
      const firstError = result.error.issues[0]?.message;
      Alert.alert("Validation Error", firstError || "Invalid input");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await authClient.signUp.email({
        email: result.data.email,
        password: result.data.password,
        name: result.data.name,
      });

      if (error) {
        Alert.alert("Error", error.message || "Something went wrong");
        return;
      }

      if (!data || !data.user.emailVerified) {
        router.replace({
          pathname: "/verify-email",
          params: { email },
        });
        return;
      }

      router.replace("/preferences/onboarding");
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>EP</Text>
          </View>

          <Text style={styles.title}>Eaglespress</Text>
          <Text style={styles.subtitleTitle}>Create your account</Text>
          <Text style={styles.subtitle}>
            Join Eaglespress and stay informed.
          </Text>
        </View>

        {/* FORM */}
        <View style={styles.form}>
          {/* NAME */}
          <Text style={styles.label}>Full name</Text>
          <View style={styles.inputContainer}>
            <Image
              source={require("@/assets/images/user-icon.png")}
              style={styles.icon}
              contentFit="contain"
            />
            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          {/* EMAIL */}
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

          {/* PASSWORD */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Image
              source={require("@/assets/images/padlock-icon.png")}
              style={styles.icon}
              contentFit="contain"
            />
            <TextInput
              placeholder="Create a password"
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

          {/* RULES */}
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>
              Password must be at least 8 characters
            </Text>

            <Rule text="At least 8 characters" valid={checks.min} />
            <Rule text="One uppercase letter" valid={checks.upper} />
            <Rule text="One lowercase letter" valid={checks.lower} />
            <Rule
              text="One number or special character"
              valid={checks.number}
            />
          </View>

          {/* BUTTON */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </Pressable>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.link} onPress={() => router.push("/login")}>
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ================= RULE ITEM ================= */

function Rule({ text, valid }: { text: string; valid: boolean }) {
  return (
    <View style={styles.ruleItem}>
      <Text style={[styles.check, { color: valid ? "#22c55e" : "#9ca3af" }]}>
        {valid ? "✓" : "•"}
      </Text>
      <Text style={[styles.ruleText, { color: valid ? "#111827" : "#6b7280" }]}>
        {text}
      </Text>
    </View>
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
    paddingBottom: 80, // ✅ IMPORTANT: prevents keyboard overlap
  },

  header: {
    alignItems: "center",
    marginBottom: 24,
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

  subtitleTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },

  form: {
    marginTop: 10,
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

  rulesContainer: {
    marginBottom: 20,
  },

  rulesTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },

  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  check: {
    marginRight: 8,
    fontSize: 14,
  },

  ruleText: {
    fontSize: 14,
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

  footer: {
    marginTop: 20,
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
