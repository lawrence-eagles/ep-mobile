import * as Notifications from "expo-notifications";

// 🔔 Ask notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("❌ Notification permission not granted");
      return false;
    }

    return true;
  } catch (err) {
    console.error("❌ Permission request error:", err);
    return false;
  }
}
