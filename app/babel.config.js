module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Add this line explicitly
      "expo-router/babel",
      // NOTE: 'react-native-reanimated/plugin' must be the last plugin.
      "react-native-reanimated/plugin",
    ],
  };
};
