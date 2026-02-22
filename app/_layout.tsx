import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { ScanProvider } from "@/contexts/ScanContext";
import { Colors } from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isOnboarded, isLoading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!isOnboarded && !inOnboarding) {
      console.log('[Layout] User not onboarded, redirecting to onboarding');
      router.replace('/onboarding');
    } else if (isOnboarded && inOnboarding) {
      console.log('[Layout] User onboarded, redirecting to home');
      router.replace('/(tabs)/(home)');
    }
  }, [isOnboarded, isLoading, segments, router]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="results/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
      <Stack.Screen name="disclaimer" options={{ title: 'Disclaimer' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <UserProvider>
          <ScanProvider>
            <RootLayoutNav />
          </ScanProvider>
        </UserProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
