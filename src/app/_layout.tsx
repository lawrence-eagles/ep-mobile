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
  const { isAuthenticated, user } = useAuth();

  // ✅ User-scoped deduplication key
  const lastRegisteredKeyRef = useRef<string | null>(null);

  // 🔔 Push setup
  useEffect(() => {
    let unsubscribeRefresh: (() => void) | undefined;

    async function setupPush() {
      try {
        if (!isAuthenticated || !user?.id) return;

        const app = getApp();
        const messaging = getMessaging(app);

        // ✅ ANDROID: Create channel BEFORE requesting permission
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
          });
        }

        // ✅ Request permission AFTER channel exists
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return;

        // ✅ Required for iOS
        await registerDeviceForRemoteMessages(messaging);

        // 1️⃣ Get FCM token
        const token = await getToken(messaging);
        const currentKey = `${user.id}:${token}`;

        if (token && currentKey !== lastRegisteredKeyRef.current) {
          console.log("📱 FCM Token:");

          const success = await sendTokenToBackend(token);

          // ✅ Only store key if backend confirms success
          if (success) {
            lastRegisteredKeyRef.current = currentKey;
          }
        }

        // 2️⃣ Listen for token refresh
        unsubscribeRefresh = onTokenRefresh(
          messaging,
          async (newToken: string) => {
            console.log("🔄 FCM Token refreshed");

            const newKey = `${user.id}:${newToken}`;

            if (newKey !== lastRegisteredKeyRef.current) {
              const success = await sendTokenToBackend(newToken);

              if (success) {
                lastRegisteredKeyRef.current = newKey;
              }
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
  }, [isAuthenticated, user?.id]);

  // ✅ Clear token state on logout
  useEffect(() => {
    if (!isAuthenticated) {
      lastRegisteredKeyRef.current = null;
    }
  }, [isAuthenticated]);

  // 🔔 Foreground notifications (no channel creation here anymore ❌➡️✅)
  useEffect(() => {
    const app = getApp();
    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, async (remoteMessage) => {
      console.log("📲 Foreground notification");

      const title = remoteMessage.notification?.title ?? "New Notification";
      const body = remoteMessage.notification?.body ?? "You have a new update";

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
      <StatusBar style="auto" />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      </Stack>

      {/* ✅ REQUIRED: Toast root */}
      <Toast />
    </QueryClientProvider>
  );
}
