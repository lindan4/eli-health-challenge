// Includes Jest's custom matchers like `toBeVisible()`
import "@testing-library/jest-native/extend-expect";

// Mock native modules that are not available in the test environment
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock")
);

jest.mock("react-native-gesture-handler", () => {
  const View = require("react-native/Libraries/Components/View/View");
  return {
    GestureHandlerRootView: View,
    GestureDetector: View,
    Gesture: {
      Tap: () => ({ onEnd: () => {} }),
    },
  };
});
