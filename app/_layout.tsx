import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { router, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import TopBanner from '../components/TopBanner';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
// Cache the Clerk JWT
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'mon': require('../assets/fonts/Montserrat-Regular.ttf'),
    'mon-b': require('../assets/fonts/Montserrat-Bold.ttf'),
    'mon-sb': require('../assets/fonts/Montserrat-SemiBold.ttf'),
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

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!} tokenCache={tokenCache}>
      <RootLayoutNav />
    </ClerkProvider>
  );
}

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    
    const inAuthGroup = segments[0] === '(modals)';
    const isRootRoute = segments[0] === undefined;
    
    // Check if the current path is valid
    const isKnownPath = ['(tabs)', '(modals)', undefined].includes(segments[0]);

    // Handle navigation based on auth state and path
    if (!isSignedIn) {
      // If not signed in, redirect to login
      if (!inAuthGroup) {
        router.replace('/(modals)/login');
      }
    } else {
      // If signed in...
      if (isRootRoute || !isKnownPath) {
        // Redirect to home if:
        // 1. At root path (localhost:8081)
        // 2. At unknown path
        router.replace('/(tabs)/home');
      }
    }
  }, [isLoaded, isSignedIn, segments]);

  if (!isLoaded) return null;

  return (
    <Stack>
      <Stack.Screen
        name="(modals)/login"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: true,
          header: () => <TopBanner />,
        }} 
      />
    </Stack>
  );
}
