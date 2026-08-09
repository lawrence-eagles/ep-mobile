// firebase-notification.ts
import { getApp } from "@react-native-firebase/app";
import type { RemoteMessage } from "@react-native-firebase/messaging";
import { getMessaging } from "@react-native-firebase/messaging";

/**
 * Get messaging instance from the default Firebase app
 */
const messaging = getMessaging(getApp());

/**
 * 🔴 Background message handler
 * Must be registered at the top level (outside React components)
 * Runs when app is in background or killed
 */
messaging.setBackgroundMessageHandler(async (remoteMessage: RemoteMessage) => {
  try {
    console.log("📩 Background message received:", {
      messageId: remoteMessage.messageId,
      data: remoteMessage.data,
      notification: remoteMessage.notification,
    });

    /**
     * 🔥 PRODUCTION NOTE:
     * You can:
     * - Store notification in local DB (e.g. MMKV / AsyncStorage)
     * - Trigger local notification display (if needed)
     * - Track analytics event
     */
  } catch (error) {
    console.error("❌ Error handling background message:", error);
  }
});
