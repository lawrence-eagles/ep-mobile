import ProfileRow from "@/components/ProfileRow";
import { useAuth } from "@/hooks/useAuth";
import { useHandleDeleteAccount } from "@/hooks/useHandleDeleteAccount";
import { useHandlePrivacyPolicy } from "@/hooks/useHandlePrivacyPolicy";
import { useHandleChangeProfileImage } from "@/hooks/useHandleProfileChange";
import { useHandleTermsAndCondition } from "@/hooks/useHandleTermsAndCondition";
import { useInitials } from "@/hooks/useInitials";
import { useLogout } from "@/hooks/useLogout";
import { useRateApp } from "@/hooks/useRateApp";
import { shareApp } from "@/lib/shareApp";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import {
  Bookmark,
  Camera,
  FileText,
  LogOut,
  Share2,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react-native";
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
import { SafeAreaView } from "react-native-safe-area-context";

// ============================================================
// COMPONENT
// ============================================================

const Profile = () => {
  // ----------------------------------------------------------
  // BETTER AUTH SESSION
  // ----------------------------------------------------------

  const {
    user,
    error: sessionError,
    isPending: isSessionLoading,
    refetch: refetchSession,
  } = useAuth();

  // ----------------------------------------------------------
  // LOCAL STATE
  // ----------------------------------------------------------

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isOpeningReview, setIsOpeningReview] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // ----------------------------------------------------------
  // ANDROID BLUR TARGET
  // ----------------------------------------------------------
  //
  // BlurTargetView provides the content that BlurView should
  // capture and blur on Android.
  //
  const blurTargetRef = useRef<View | null>(null);

  const handleChangeProfileImage = useHandleChangeProfileImage(
    isUploadingImage,
    setIsUploadingImage,
  );

  const handleLogout = useLogout(isDeletingAccount);

  const handleDeleteAccount = useHandleDeleteAccount(
    isDeletingAccount,
    setIsDeletingAccount,
  );

  const handleRateUs = useRateApp(isOpeningReview, setIsOpeningReview);

  const handlePrivacyPolicy = useHandlePrivacyPolicy();

  const handleTerms = useHandleTermsAndCondition();

  const { displayName, initials } = useInitials();

  // ==========================================================
  // SESSION LOADING
  // ==========================================================

  if (isSessionLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color="#1677FF" />

        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // SESSION ERROR
  // ==========================================================

  if (!sessionError && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (sessionError || !user) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={["top"]}>
        <View style={styles.errorIconContainer}>
          <ShieldCheck size={30} color="#1677FF" />
        </View>

        <Text style={styles.errorTitle}>Unable to load your profile</Text>

        <Text style={styles.errorMessage}>
          We couldn't load your account information. Please check your
          connection and try again.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
          ]}
          onPress={() => {
            void refetchSession();
          }}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ================================================== */}
        {/* HERO / PROFILE HEADER */}
        {/* ================================================== */}

        {/*
          BlurTargetView captures the background content that
          the settings-card BlurView will blur on Android.

          Keeping the hero inside the target also allows the
          blurred card to visually pick up the gradient behind it.
        */}
        <BlurTargetView ref={blurTargetRef} style={styles.blurTarget}>
          <LinearGradient
            colors={["#087CFF", "#4E9DFF", "#DCEBFF", "#F8FAFC"]}
            locations={[0, 0.38, 0.72, 1]}
            style={styles.hero}
          >
            {/* Profile Image */}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile picture"
              accessibilityHint="Opens your photo library so you can choose a new profile picture"
              onPress={() => {
                void handleChangeProfileImage();
              }}
              disabled={isUploadingImage}
              style={({ pressed }) => [
                styles.avatarPressable,
                pressed && !isUploadingImage && styles.avatarPressed,
              ]}
            >
              <View style={styles.avatarWrapper}>
                {user.image ? (
                  <Image
                    source={{ uri: user.image }}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                    onError={(error) => {
                      console.warn("[profile] AVATAR IMAGE ERROR:", error);
                    }}
                  />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsText}>{initials}</Text>
                  </View>
                )}

                <View style={styles.cameraButton}>
                  {isUploadingImage ? (
                    <ActivityIndicator size="small" color="#1677FF" />
                  ) : (
                    <Camera size={25} color="#1677FF" strokeWidth={2.5} />
                  )}
                </View>
              </View>
            </Pressable>

            {/* Name */}

            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>

            {/* Logout */}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out"
              onPress={() => {
                void handleLogout();
              }}
              disabled={isDeletingAccount}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
            >
              <LogOut size={30} color="#1677FF" strokeWidth={2} />

              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </LinearGradient>
        </BlurTargetView>

        {/* ================================================== */}
        {/* SETTINGS CARD */}
        {/* ================================================== */}

        <View style={styles.cardWrapper}>
          <BlurView
            intensity={45}
            tint="light"
            blurMethod="dimezisBlurView"
            blurTarget={blurTargetRef}
            style={styles.blurCard}
          >
            <View style={styles.cardOverlay}>
              {/* BOOKMARKS */}

              <ProfileRow
                icon={<Bookmark size={34} color="#111827" strokeWidth={1.9} />}
                label="Bookmarks"
                onPress={() => {
                  router.push("/(tabs)/bookmarks");
                }}
              />

              <View style={styles.separator} />

              {/* SHARE */}

              <ProfileRow
                icon={<Share2 size={34} color="#111827" strokeWidth={1.9} />}
                label="Share Eaglespress"
                loading={isSharing}
                onPress={async () => {
                  if (isSharing) return;

                  try {
                    setIsSharing(true);

                    const share = await shareApp("profile-detail");

                    if (
                      !share ||
                      typeof share.shareId !== "string" ||
                      !share.shareId.trim() ||
                      typeof share.url !== "string" ||
                      !share.url.trim()
                    ) {
                      throw new Error("Invalid share response");
                    }

                    router.push({
                      pathname: "/share/app-screen",
                      params: {
                        shareId: share.shareId,
                        url: share.url,
                      },
                    });
                  } catch {
                    Alert.alert("Error", "Unable to create a share link");
                  } finally {
                    setIsSharing(false);
                  }
                }}
              />

              <View style={styles.separator} />

              {/* RATE */}

              <ProfileRow
                icon={<Star size={34} color="#111827" strokeWidth={1.9} />}
                label="Rate us"
                onPress={() => {
                  void handleRateUs();
                }}
                loading={isOpeningReview}
              />

              <View style={styles.separator} />

              {/* PRIVACY */}

              <ProfileRow
                icon={
                  <ShieldCheck size={34} color="#111827" strokeWidth={1.9} />
                }
                label="Privacy Policy"
                onPress={() => {
                  void handlePrivacyPolicy();
                }}
              />

              <View style={styles.separator} />

              {/* TERMS */}

              <ProfileRow
                icon={<FileText size={34} color="#111827" strokeWidth={1.9} />}
                label="Terms & Conditions"
                onPress={() => {
                  void handleTerms();
                }}
              />

              <View style={styles.separator} />

              {/* DELETE */}

              <ProfileRow
                icon={<Trash2 size={34} color="#EF2029" strokeWidth={1.9} />}
                label="Delete Account"
                labelColor="#EF2029"
                onPress={handleDeleteAccount}
                loading={isDeletingAccount}
                destructive
              />
            </View>
          </BlurView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ----------------------------------------------------------
  // ROOT
  // ----------------------------------------------------------

  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  // ----------------------------------------------------------
  // BLUR TARGET
  // ----------------------------------------------------------

  blurTarget: {
    width: "100%",
  },

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 28,
  },

  errorIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF3FF",
    marginBottom: 18,
  },

  errorTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },

  errorMessage: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 340,
  },

  retryButton: {
    marginTop: 24,
    minWidth: 140,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1677FF",
  },

  retryButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // ----------------------------------------------------------
  // HERO
  // ----------------------------------------------------------

  hero: {
    minHeight: 415,
    alignItems: "center",
    paddingTop: 34,
    paddingHorizontal: 20,
  },

  // ----------------------------------------------------------
  // AVATAR
  // ----------------------------------------------------------

  avatarPressable: {
    borderRadius: 100,
  },

  avatarPressed: {
    transform: [{ scale: 0.97 }],
  },

  avatarWrapper: {
    position: "relative",
    width: 190,
    height: 190,
  },

  avatar: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 5,
    borderColor: "#FFFFFF",
    backgroundColor: "#DDE7F0",
  },

  initialsAvatar: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 5,
    borderColor: "#FFFFFF",
    backgroundColor: "#D8E8F7",
    alignItems: "center",
    justifyContent: "center",
  },

  initialsText: {
    fontSize: 58,
    fontWeight: "800",
    color: "#1677FF",
  },

  cameraButton: {
    position: "absolute",
    right: -3,
    bottom: 4,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",

    // Android elevation
    elevation: 5,

    // iOS shadow
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 7,
  },

  // ----------------------------------------------------------
  // USER NAME
  // ----------------------------------------------------------

  userName: {
    maxWidth: "90%",
    marginTop: 30,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700",
    color: "#050505",
    textAlign: "center",
  },

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------

  logoutButton: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
  },

  logoutButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.35)",
    opacity: 0.75,
  },

  logoutText: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "500",
    color: "#1677FF",
  },

  // ----------------------------------------------------------
  // SETTINGS CARD
  // ----------------------------------------------------------

  cardWrapper: {
    marginTop: -1,
    marginHorizontal: 14,
    borderRadius: 34,
    overflow: "hidden",

    // Android
    elevation: 5,

    // iOS
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },

  blurCard: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(229,231,235,0.85)",

    // Reduced from 0.88 so the blur remains visible.
    backgroundColor: "rgba(255,255,255,0.30)",
  },

  cardOverlay: {
    // Reduced from 0.66 so the blurred background remains visible.
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 24,
    paddingVertical: 8,
  },

  // ----------------------------------------------------------
  // ROW
  // ----------------------------------------------------------

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 0,
  },
});
