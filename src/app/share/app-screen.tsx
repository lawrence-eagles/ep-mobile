import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Share2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ================= TYPES =================

type Params = {
  channel?: string;
  shareId?: string;
  url?: string;
};

// ================= COMPONENT =================

const AppShareScreen = () => {
  const { shareId, url } = useLocalSearchParams<Params>();

  const [loading, setLoading] = useState(false);

  // ================= DERIVED =================

  const shareUrl = useMemo(() => {
    if (url) return url;
    if (shareId) return `https://eaglespress.com/s/${shareId}`;
    return null;
  }, [url, shareId]);

  // ================= HELPERS =================

  const ensureValidUrl = () => {
    if (!shareUrl) {
      Alert.alert(
        "Missing Link",
        "We couldn't find a valid link to share. Please try again.",
      );
      return false;
    }
    return true;
  };

  // ================= SHARE HANDLERS =================

  const handleNativeShare = async () => {
    if (!ensureValidUrl()) return;

    try {
      setLoading(true);

      await Share.share({
        message: `Check out this AI powered News App for smarter reading: ${shareUrl}`,
        url: shareUrl ?? undefined,
      });
    } catch (error) {
      Alert.alert(
        "Sharing Failed",
        "Unable to share right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const openSocial = async (
    platform: "facebook" | "twitter" | "whatsapp" | "linkedin",
  ) => {
    if (!ensureValidUrl()) return;

    try {
      const encodedUrl = encodeURIComponent(shareUrl as string);

      const urls: Record<typeof platform, string> = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      };

      const selectedUrl = urls[platform];

      const supported = await Linking.canOpenURL(selectedUrl);

      if (!supported) {
        Alert.alert(
          "App Not Available",
          "Cannot open this platform on your device.",
        );
        return;
      }

      await Linking.openURL(selectedUrl);
    } catch (error) {
      Alert.alert(
        "Error",
        "Something went wrong while opening the app. Please try again.",
      );
    }
  };

  // ================= UI =================

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Share Eaglespress</Text>

        <Text style={styles.subtitle}>
          Help friends discover smarter news with Eaglespress.
        </Text>

        {/* Hero Image */}
        <Image
          source={require("@/assets/images/share-app-hero.png")}
          style={styles.hero}
          contentFit="contain"
        />

        {/* Features */}
        <View style={styles.features}>
          {[
            "AI summarizes the news for you",
            "News from quality trusted sources",
            "Personalized just for you",
          ].map((item, index) => (
            <View key={index} style={styles.featureItem}>
              <Check size={18} color="#2563EB" />
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Social Buttons */}
      <View style={styles.socialRow}>
        <Pressable onPress={() => openSocial("whatsapp")}>
          <Text style={styles.social}>WhatsApp</Text>
        </Pressable>

        <Pressable onPress={() => openSocial("twitter")}>
          <Text style={styles.social}>Twitter</Text>
        </Pressable>

        <Pressable onPress={() => openSocial("facebook")}>
          <Text style={styles.social}>Facebook</Text>
        </Pressable>

        <Pressable onPress={() => openSocial("linkedin")}>
          <Text style={styles.social}>LinkedIn</Text>
        </Pressable>
      </View>

      {/* CTA Button */}
      <Pressable
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}
        onPress={handleNativeShare}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Share2 color="#fff" size={20} />
            <Text style={styles.buttonText}>Share the App</Text>
          </>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

export default AppShareScreen;

// ================= STYLES =================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 20,
  },

  header: {
    marginBottom: 10,
  },

  back: {
    fontSize: 24,
  },

  content: {
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2563EB",
    marginTop: 10,
  },

  subtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#6B7280",
    marginVertical: 10,
  },

  hero: {
    width: "100%",
    height: 260,
    marginVertical: 20,
  },

  features: {
    width: "100%",
    gap: 12,
  },

  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  featureText: {
    fontSize: 15,
    color: "#374151",
  },

  socialRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },

  social: {
    color: "#2563EB",
    fontWeight: "600",
  },

  button: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
