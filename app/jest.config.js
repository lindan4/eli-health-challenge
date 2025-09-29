module.exports = {
  preset: "jest-expo",
  // This is the key to fixing the error. It tells Jest to use Babel
  // to transform these specific libraries from your node_modules.
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
  // This points to the setup file we created in Step 1
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
