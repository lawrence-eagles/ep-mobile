import { Image } from "expo-image";
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
import { SafeAreaView } from "react-native-safe-area-context";

const GoodBye = () => {
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Returns the user to the login screen.
   */
  const handleReturnToLogin = async (): Promise<void> => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      router.replace("/login");
    } catch (error: unknown) {
      console.error("Failed to navigate to login:", error);

      Alert.alert(
        "Something went wrong",
        "We couldn't return you to the login screen. Please try again.",
        [{ text: "OK" }],
      );

      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          {/* EP LOGO */}
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>EP</Text>
          </View>

          <Text style={styles.title}>Eaglespress</Text>
        </View>

        {/* HERO IMAGE */}
        <Image
          source={require("@/assets/images/account-deleted-hero.png")}
          style={styles.heroImage}
          contentFit="contain"
          accessibilityLabel="Account successfully deleted illustration"
        />

        {/* CONTENT */}
        <View style={styles.content}>
          <Text style={styles.heading}>Account deleted</Text>

          <Text style={styles.description}>
            Your account has been successfully{"\n"}
            deleted. We are sorry to see you go.
          </Text>

          <Text style={styles.description}>
            Thank you for being a part of{"\n"}
            Eaglespress.
          </Text>
        </View>

        {/* RETURN TO LOGIN */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleReturnToLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && !loading && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Return to login"
            accessibilityState={{
              disabled: loading,
              busy: loading,
            }}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                accessibilityLabel="Returning to login"
              />
            ) : (
              <Text style={styles.loginButtonText}>Return to Login</Text>
            )}
          </Pressable>
        </View>

        {/* DECORATIVE BOTTOM WAVES */}
        {/* <View pointerEvents="none" style={styles.bottomDecoration}>
          <View style={[styles.wave, styles.waveOne]} />
          <View style={[styles.wave, styles.waveTwo]} />
          <View style={[styles.wave, styles.waveThree]} />
          <View style={[styles.wave, styles.waveFour]} />
          <View style={[styles.wave, styles.waveFive]} />
          <View style={[styles.wave, styles.waveSix]} />
          <View style={[styles.wave, styles.waveSeven]} />
          <View style={[styles.wave, styles.waveEight]} />
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default GoodBye;

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  scrollContent: {
    flexGrow: 1,
    minHeight: "100%",
    paddingHorizontal: 24,
    paddingBottom: 0,
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    alignItems: "center",
    paddingTop: 24,
  },

  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: "#1677F9",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#1677F9",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },

  logoText: {
    color: "#ffffff",
    fontSize: 58,
    fontWeight: "400",
    letterSpacing: -3,
    lineHeight: 64,
    includeFontPadding: false,
  },

  title: {
    color: "#1677F9",
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -1.2,
    textAlign: "center",
    marginTop: 20,
  },

  /* =======================================================
     HERO
  ======================================================= */

  heroImage: {
    width: "100%",
    height: 420,
    marginTop: 28,
  },

  /* =======================================================
     CONTENT
  ======================================================= */

  content: {
    alignItems: "center",
    paddingHorizontal: 6,
    marginTop: -4,
  },

  heading: {
    color: "#111827",
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "700",
    letterSpacing: -0.8,
    textAlign: "center",
  },

  description: {
    color: "#6b7280",
    fontSize: 21,
    lineHeight: 34,
    fontWeight: "400",
    textAlign: "center",
    marginTop: 18,
  },

  /* =======================================================
     BUTTON
  ======================================================= */

  actions: {
    width: "100%",
    alignItems: "center",
    marginTop: 38,
  },

  loginButton: {
    width: "92%",
    minHeight: 70,
    borderRadius: 35,
    backgroundColor: "#1677F9",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#1677F9",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },

  loginButtonText: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  /* =======================================================
     BOTTOM DECORATIVE WAVES
  ======================================================= */

  bottomDecoration: {
    width: "125%",
    height: 185,
    alignSelf: "center",
    marginTop: 4,
    overflow: "hidden",
    opacity: 0.75,
  },

  wave: {
    position: "absolute",
    width: "135%",
    height: 115,
    left: "-17.5%",
    borderTopWidth: 1,
    borderTopColor: "#dbeafe",
    borderRadius: 999,
  },

  waveOne: {
    top: 42,
    transform: [{ rotate: "-11deg" }],
  },

  waveTwo: {
    top: 50,
    transform: [{ rotate: "-10deg" }],
  },

  waveThree: {
    top: 58,
    transform: [{ rotate: "-9deg" }],
  },

  waveFour: {
    top: 66,
    transform: [{ rotate: "-8deg" }],
  },

  waveFive: {
    top: 74,
    transform: [{ rotate: "-7deg" }],
  },

  waveSix: {
    top: 82,
    transform: [{ rotate: "-6deg" }],
  },

  waveSeven: {
    top: 90,
    transform: [{ rotate: "-5deg" }],
  },

  waveEight: {
    top: 98,
    transform: [{ rotate: "-4deg" }],
  },
});
