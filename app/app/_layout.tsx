import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AppProvider } from '@/context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';

import 'react-native-gesture-handler'; // ✨ ADD THIS LINE AT THE VERY TOP
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'top']}>
      <AppProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>

          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="preview" options={{ title: "Preview", headerBackTitle: 'Back' }} />
            <Stack.Screen name="results" options={{ title: "Results", headerBackTitle: 'Back' }} />
          </Stack>
        </GestureHandlerRootView>
      </AppProvider>
    </SafeAreaView>
  );
}
