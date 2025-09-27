export default {
  name: "TestStripScanner",
  plugins: [
    [
      "react-native-vision-camera",
      {
        cameraPermissionText: "TestStripScanner needs access to your camera",
        enableMicrophonePermission: false
      }
    ]
  ],
  android: {
    package: "com.anonymous.teststripscanner"
  },
  ios: {
    bundleIdentifier: "com.anonymous.teststripscanner"
  }
};