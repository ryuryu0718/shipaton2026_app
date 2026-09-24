import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { OnboardingProvider, useOnboarding } from '@/lib/onboarding';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <OnboardingProvider>
          <ThemedRoot />
        </OnboardingProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function ThemedRoot() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const palette = Colors[isDark ? 'dark' : 'light'];

  const navTheme = {
    ...(isDark ? NavDarkTheme : NavDefaultTheme),
    colors: {
      ...(isDark ? NavDarkTheme : NavDefaultTheme).colors,
      background: palette.background,
      card: palette.background,
      text: palette.text,
      border: palette.border,
      primary: palette.tint,
      notification: palette.tint,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </ThemeProvider>
  );
}

/**
 * 認証状態とオンボーディング完了状況で表示するスタックを振り分ける。
 * expo-router 公式の「保護されたルート」パターン（useSegments + replace）。
 */
function RootNavigator() {
  const { status } = useAuth();
  const { done: onboarded } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  const ready = status !== 'loading' && onboarded !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const first = segments[0];
    const inSignIn = first === 'sign-in';
    const inOnboarding = first === 'onboarding';

    if (status === 'signedOut') {
      if (!inSignIn) router.replace('/sign-in');
      return;
    }
    // signedIn または guest
    if (!onboarded) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }
    if (inSignIn || inOnboarding) router.replace('/');
  }, [ready, status, onboarded, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen
        name="entry/new"
        options={{ presentation: 'modal', gestureEnabled: true }}
      />
      <Stack.Screen name="entry/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="book/new" options={{ headerShown: true, title: '本を作る' }} />
      <Stack.Screen name="book/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="emergency-contacts"
        options={{ headerShown: true, title: '緊急連絡先' }}
      />
    </Stack>
  );
}
