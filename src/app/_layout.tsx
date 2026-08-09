import { useAuth } from "@/hooks/useAuth";
import { requestNotificationPermission } from "@/lib/requestNotificationPermission";
import { sendTokenToBackend } from "@/lib/sendTokenToBackend";
import { getApp } from "@react-native-firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
} from "@react-native-firebase/messaging";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import "../firebase-messaging"; // ✅ background handler

// React Query client
const queryClient = new QueryClient();

export default function RootLayout() {
  const { isAuthenticated } = useAuth();
  const lastTokenRef = useRef<string | null>(null);

  // 🔔 Push setup
  useEffect(() => {
    let unsubscribeRefresh: (() => void) | undefined;

    async function setupPush() {
      try {
        if (!isAuthenticated) return;

        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return;

        const app = getApp();
        const messaging = getMessaging(app);

        // ✅ Required for iOS
        await registerDeviceForRemoteMessages(messaging);

        // 1️⃣ Get FCM token
        const token = await getToken(messaging);

        if (token && token !== lastTokenRef.current) {
          lastTokenRef.current = token;
          console.log("📱 FCM Token:", token);

          await sendTokenToBackend(token);
        }

        // 2️⃣ Listen for token refresh
        unsubscribeRefresh = onTokenRefresh(
          messaging,
          async (newToken: string) => {
            console.log("🔄 FCM Token refreshed:", newToken);

            if (newToken !== lastTokenRef.current) {
              lastTokenRef.current = newToken;
              await sendTokenToBackend(newToken);
            }
          },
        );
      } catch (err) {
        console.error("❌ Push setup error:", err);
      }
    }

    setupPush();

    return () => {
      if (unsubscribeRefresh) unsubscribeRefresh();
    };
  }, [isAuthenticated]);

  // 🔔 Foreground notifications (UPDATED ✅)
  useEffect(() => {
    const app = getApp();
    const messaging = getMessaging(app);

    // ✅ Android notification channel
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const unsubscribe = onMessage(messaging, async (remoteMessage) => {
      console.log("📲 Foreground notification:", remoteMessage);

      const title = remoteMessage.notification?.title ?? "New Notification";
      const body = remoteMessage.notification?.body ?? "You have a new update";

      // ✅ Toast instead of Alert
      Toast.show({
        type: "success",
        text1: title,
        text2: body,
        position: "top",
        visibilityTime: 4000,
      });
    });

    return unsubscribe;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      </Stack>

      {/* ✅ REQUIRED: Toast root */}
      <Toast />
    </QueryClientProvider>
  );
}
