import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VerifyDeleteAccount = () => {
  const [loadingInbox, setLoadingInbox] = useState<boolean>(false);

  /**
   * Opens the user's default email application.
   *
   * There is no universal cross-platform URL that can open the
   * inbox of every email provider. `mailto:` is the most reliable
   * cross-platform way to launch the device's configured email app.
   */
  const handleGoToEmailApp = async (): Promise<void> => {
    if (loadingInbox) {
      return;
    }

    try {
      setLoadingInbox(true);

      const emailUrl = "mailto:";

      const canOpenEmailApp = await Linking.canOpenURL(emailUrl);

      if (!canOpenEmailApp) {
        Alert.alert(
          "Email App Unavailable",
          "We couldn't find an email application on this device. Please open your email app manually and check your inbox.",
          [{ text: "OK" }],
        );
        return;
      }

      await Linking.openURL(emailUrl);
    } catch (error: unknown) {
      console.error("Failed to open email application:", error);

      Alert.alert(
        "Unable to Open Email",
        "We couldn't open your email application. Please open your email app manually and check your inbox.",
        [{ text: "OK" }],
      );
    } finally {
      setLoadingInbox(false);
    }
  };

  /**
   * Returns the user to the previous screen.
   */
  const handleGoBack = (): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    // Fallback in case this screen is the first screen in the stack.
    router.replace("/login");
  };

  /**
   * Returns the user to the login screen.
   */
  const handleReturnToLogin = (): void => {
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={Platform.OS === "ios"}
      >
        {/* BACK BUTTON */}
        <View style={styles.topBar}>
          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        </View>

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
          source={require("@/assets/images/confirm-delete-account-hero.png")}
          style={styles.heroImage}
          contentFit="contain"
          accessibilityLabel="Email confirmation illustration"
        />

        {/* CONTENT */}
        <View style={styles.content}>
          <Text style={styles.heading}>Check your email</Text>

          <Text style={styles.description}>
            We have sent you an email with a link to{"\n"}
            confirm the deletion of your account.
          </Text>

          <Text style={styles.description}>
            Please check your inbox and follow{"\n"}
            the instructions to proceed.
          </Text>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          {/* GO TO EMAIL APP */}
          <Pressable
            onPress={handleGoToEmailApp}
            disabled={loadingInbox}
            style={({ pressed }) => [
              styles.inboxButton,
              pressed && !loadingInbox && styles.buttonPressed,
              loadingInbox && styles.buttonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go to email app"
            accessibilityState={{ disabled: loadingInbox, busy: loadingInbox }}
          >
            {loadingInbox ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                accessibilityLabel="Opening email application"
              />
            ) : (
              <Text style={styles.inboxButtonText}>Open Email App</Text>
            )}
          </Pressable>

          {/* RETURN TO LOGIN */}
          <Pressable
            onPress={handleReturnToLogin}
            style={({ pressed }) => [
              styles.returnButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Return to login"
          >
            <Text style={styles.returnButtonText}>Return to Login</Text>
          </Pressable>
        </View>

        {/* BOTTOM DECORATION */}
        {/* <View pointerEvents="none" style={styles.bottomDecoration}>
          <View style={styles.wave waveOne} />
          <View style={styles.wave waveTwo} />
          <View style={styles.wave waveThree} />
          <View style={styles.wave waveFour} />
          <View style={styles.wave waveFive} />
          <View style={styles.wave waveSix} />
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default VerifyDeleteAccount;

/* ========================= STYLES ========================= */

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
    paddingBottom: 40,
  },

  /* ========================= TOP BAR ========================= */

  topBar: {
    height: 58,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },

  backArrow: {
    color: "#111827",
    fontSize: 42,
    fontWeight: "300",
    lineHeight: 44,
    includeFontPadding: false,
  },

  /* ========================= HEADER ========================= */

  header: {
    alignItems: "center",
    marginTop: 12,
  },

  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: "#1677F9",
    alignItems: "center",
    justifyContent: "center",

    // Subtle depth similar to the reference design.
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
    marginTop: 20,
    color: "#1677F9",
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -1.2,
    textAlign: "center",
  },

  /* ========================= HERO ========================= */

  heroImage: {
    width: "100%",
    height: 420,
    marginTop: 28,
  },

  /* ========================= CONTENT ========================= */

  content: {
    alignItems: "center",
    paddingHorizontal: 8,
    marginTop: -2,
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

  /* ========================= ACTIONS ========================= */

  actions: {
    width: "100%",
    alignItems: "center",
    marginTop: 36,
  },

  inboxButton: {
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

  inboxButtonText: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  returnButton: {
    minHeight: 58,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  returnButtonText: {
    color: "#1677F9",
    fontSize: 22,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.65,
  },

  /* ========================= BOTTOM DECORATION ========================= */

  bottomDecoration: {
    height: 170,
    width: "120%",
    alignSelf: "center",
    marginTop: 20,
    overflow: "hidden",
    opacity: 0.7,
  },

  wave: {
    position: "absolute",
    width: "130%",
    height: 100,
    left: "-15%",
    borderTopWidth: 1,
    borderTopColor: "#dbeafe",
    borderRadius: 999,
    transform: [
      {
        rotate: "-8deg",
      },
    ],
  },

  waveOne: {
    top: 50,
  },

  waveTwo: {
    top: 58,
  },

  waveThree: {
    top: 66,
  },

  waveFour: {
    top: 74,
  },

  waveFive: {
    top: 82,
  },

  waveSix: {
    top: 90,
  },
});
