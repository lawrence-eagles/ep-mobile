import { authClient } from "@/lib/auth-client";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function VerifyEmail() {
  const params = useLocalSearchParams();

  const email = typeof params?.email === "string" ? params.email : undefined;
  const [loading, setLoading] = useState(false);
  const callbackURL = Linking.createURL("/email-verified");

  useEffect(() => {
    if (!email) {
      router.replace("/register");
    }
  }, [email]);

  const handleResend = async () => {
    try {
      if (!email) {
        throw new Error("Email is missing");
      }

      setLoading(true);

      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL, // optional
      });

      if (error) {
        throw new Error(error.message);
      }

      Alert.alert("Email sent", "A new verification email has been sent.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to resend email");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    router.replace("/register");
  };

  return (
    <View style={styles.container}>
      {/* Back */}
      {/* <Text style={styles.backText}>←</Text> */}
      {/* <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color="#0f172a" />
      </Pressable> */}

      {/* Illustration */}
      <Image
        source={require("@/assets/images/verify-email-envelop-crop.png")}
        style={styles.image}
        contentFit="contain"
      />

      {/* Title */}
      <Text style={styles.title}>Verify your email</Text>

      {/* Description */}
      <Text style={styles.description}>
        We have sent a verification link to{" "}
        <Text style={styles.email}>{email}</Text>
      </Text>

      <Text style={styles.subText}>
        Please check your inbox and click the link to verify your account.
      </Text>

      {/* Info Card */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Did not receive the email?</Text>
        <Text style={styles.infoText}>
          Check your spam folder or resend the email.
        </Text>
      </View>

      {/* Resend Button */}
      <Pressable
        onPress={handleResend}
        disabled={loading}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Resend Email</Text>
        )}
      </Pressable>

      {/* Change Email */}
      <Pressable onPress={handleChangeEmail}>
        <Text style={styles.link}>Change Email Address</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 24,
    alignItems: "center",
  },

  back: {
    position: "absolute",
    top: 60,
    left: 24,
  },

  backText: {
    fontSize: 24,
    color: "#0f172a",
  },

  image: {
    width: 260,
    height: 260,
    marginTop: 100,
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
    textAlign: "center",
  },

  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#475569",
  },

  email: {
    color: "#2563eb",
    fontWeight: "600",
  },

  subText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 20,
  },

  infoBox: {
    width: "100%",
    backgroundColor: "#eef2ff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 30,
  },

  infoTitle: {
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },

  infoText: {
    color: "#64748b",
  },

  button: {
    width: "100%",
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginBottom: 16,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  link: {
    color: "#2563eb",
    fontWeight: "500",
    fontSize: 15,
  },
});
