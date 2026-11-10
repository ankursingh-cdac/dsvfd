import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/features/auth/store/authStore';

export default function RootLayout() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#FFF0E4" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFF0E4' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="multiplayer" />
        <Stack.Screen name="room" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="daily-challenge" />
        <Stack.Screen name="spin-wheel" />
        <Stack.Screen name="shop" />
      </Stack>
    </SafeAreaProvider>
  );
}
