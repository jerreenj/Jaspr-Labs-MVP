import { Stack } from 'expo-router';
import { PrivyProvider } from '@privy-io/expo';
import Constants from 'expo-constants';

const PRIVY_APP_ID = Constants.expoConfig?.extra?.PRIVY_APP_ID || process.env.EXPO_PUBLIC_PRIVY_APP_ID || 'cmkrvglr70122jl0cbrw349iu';

export default function RootLayout() {
  return (
    <PrivyProvider appId={PRIVY_APP_ID}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="send" />
        <Stack.Screen name="swap" />
        <Stack.Screen name="history" />
      </Stack>
    </PrivyProvider>
  );
}
