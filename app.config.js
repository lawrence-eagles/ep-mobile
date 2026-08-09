export default {
  expo: {
    name: "eaglespress",
    slug: "eaglespress",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/eaglespress-icon.png",
    scheme: "eaglespress",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/images/eaglespress-icon.png",
      bundleIdentifier: "com.anonymous.eaglespress",
      googleServicesFile: "./GoogleService-Info.plist",
      supportsTablet: true,
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/eaglespress-adaptive-icon.png",
      },
      predictiveBackGestureEnabled: false,
      package: "com.anonymous.eaglespress",
      googleServicesFile: "./google-services.json",
      permissions: ["NOTIFICATIONS"],
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          image: "./assets/images/splash-screen.png",
          imageWidth: 140,
        },
      ],
      "expo-web-browser",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#ffffff",
          defaultChannel: "default",
          sounds: [],
          enableBackgroundRemoteNotifications: false,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
