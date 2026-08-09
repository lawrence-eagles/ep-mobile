import * as Notifications from "expo-notifications";

// 🔔 Ask notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const existingPermissions = await Notifications.getPermissionsAsync();
    let hasPermission =
      existingPermissions.granted ||
      existingPermissions.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!hasPermission) {
      const requestedPermissions =
        await Notifications.requestPermissionsAsync();
      hasPermission =
        requestedPermissions.granted ||
        requestedPermissions.ios?.status ===
          Notifications.IosAuthorizationStatus.PROVISIONAL;
    }
    if (!hasPermission) {
      console.log("❌ Notification permission not granted");
      return false;
    }
    return true;
  } catch (err) {
    console.error("❌ Permission request error:", err);
    return false;
  }
}
