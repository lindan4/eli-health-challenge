import { ExpoConfig } from '@expo/config-types';

const config: ExpoConfig = {
  name: "TestStripScanner",
  slug: "test-strip-scanner",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "app",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.anonymous.teststripscanner",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.anonymous.teststripscanner",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "react-native-vision-camera",
      {
        cameraPermissionText: "TestStripScanner needs access to your camera",
        enableMicrophonePermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;